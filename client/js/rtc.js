// ===== الصوت: WebRTC mesh بنمط Perfect Negotiation =====
// كل عميل يفتح المايك ينشر مساره، والباقي يستمع. التفاوض تلقائي وآمن من التصادم.
window.RTC = (() => {
  let socket = null;
  let mySocketId = null;
  const peers = new Map();   // socketId -> { pc, makingOffer, ignoreOffer, polite }
  const audios = new Map();  // socketId -> audio element
  const localStreamRef = { stream: null };
  let micOn = false;
  let onRemoteCount = () => {};

  const ICE = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] };

  function init(sock, onCount) {
    socket = sock;
    if (onCount) onRemoteCount = onCount;

    socket.on('rtc:peers', ({ unmuted }) => syncPeers(unmuted || []));

    socket.on('rtc:signal', async ({ from, data }) => {
      if (from === mySocketId) return;
      const ctx = ensurePeer(from);
      const { pc } = ctx;
      try {
        if (data.sdp) {
          const offerCollision = data.sdp.type === 'offer' && (ctx.makingOffer || pc.signalingState !== 'stable');
          ctx.ignoreOffer = !ctx.polite && offerCollision;
          if (ctx.ignoreOffer) return;
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          if (data.sdp.type === 'offer') {
            await pc.setLocalDescription();
            send(from, { sdp: pc.localDescription });
          }
        } else if (data.candidate) {
          try { await pc.addIceCandidate(new RTCIceCandidate(data.candidate)); }
          catch (e) { if (!ctx.ignoreOffer) console.warn('ICE error', e); }
        }
      } catch (e) { console.warn('rtc signal error', e); }
    });
  }

  function setMyId(id) { mySocketId = id; }

  function send(to, data) { socket.emit('rtc:signal', { to, data }); }

  function ensurePeer(pid) {
    if (peers.has(pid)) return peers.get(pid);
    const pc = new RTCPeerConnection(ICE);
    const ctx = { pc, makingOffer: false, ignoreOffer: false, polite: mySocketId > pid };
    peers.set(pid, ctx);

    // نبدأ بمستقبل صوت؛ وإذا عندنا مايك مفتوح نضيف مسارنا
    if (localStreamRef.stream) {
      localStreamRef.stream.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.stream));
    } else {
      pc.addTransceiver('audio', { direction: 'recvonly' });
    }

    pc.onnegotiationneeded = async () => {
      try {
        ctx.makingOffer = true;
        await pc.setLocalDescription();
        send(pid, { sdp: pc.localDescription });
      } catch (e) { console.warn('negotiation error', e); }
      finally { ctx.makingOffer = false; }
    };
    pc.onicecandidate = (e) => { if (e.candidate) send(pid, { candidate: e.candidate }); };
    pc.ontrack = (e) => { playRemote(pid, e.streams[0]); };
    pc.onconnectionstatechange = () => {
      if (['failed', 'closed'].includes(pc.connectionState)) disposePeer(pid);
    };
    updateCount();
    return ctx;
  }

  function disposePeer(pid) {
    const ctx = peers.get(pid);
    if (ctx) { try { ctx.pc.close(); } catch (e) {} peers.delete(pid); }
    stopAudio(pid);
    updateCount();
  }

  function updateCount() { onRemoteCount(peers.size); }

  // مزامنة قائمة المفتوحين مايكهم من السيرفر
  function syncPeers(unmutedSocketIds) {
    const wanted = new Set(unmutedSocketIds.filter((id) => id !== mySocketId));
    // أغلق الاتصالات غير الموجودة في القائمة
    [...peers.keys()].forEach((pid) => { if (!wanted.has(pid)) disposePeer(pid); });
    // أنشئ الاتصالات الناقصة
    wanted.forEach((pid) => ensurePeer(pid));
  }

  function playRemote(pid, stream) {
    let a = audios.get(pid);
    if (!a) {
      a = document.createElement('audio');
      a.autoplay = true;
      a.setAttribute('playsinline', '');
      document.body.appendChild(a);
      audios.set(pid, a);
    }
    if (a.srcObject !== stream) a.srcObject = stream;
    a.play().catch(() => {});
  }

  function stopAudio(pid) {
    const a = audios.get(pid);
    if (a) { a.srcObject = null; a.remove(); audios.delete(pid); }
  }

  async function enableMic() {
    if (!localStreamRef.stream) {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      localStreamRef.stream = stream;
      // أضف المسار لكل الاتصالات القائمة (يرفع إعادة تفاوض تلقائياً)
      peers.forEach(({ pc }) => stream.getTracks().forEach((t) => { try { pc.addTrack(t, stream); } catch (e) {} }));
    }
    // ألغِ كتم المسارات إن كانت مكتومة
    localStreamRef.stream.getAudioTracks().forEach((t) => { t.enabled = true; });
    micOn = true;
    return localStreamRef.stream;
  }

  function disableMic() {
    if (!localStreamRef.stream) return;
    // نكتّم فقط (نبقي الاتصال) — أفضل من قطع المسارات لإعادة الاتصال السريع
    localStreamRef.stream.getAudioTracks().forEach((t) => { t.enabled = false; });
    micOn = false;
  }

  function dropMic() {
    if (!localStreamRef.stream) return;
    const tracks = localStreamRef.stream.getTracks();
    peers.forEach(({ pc }) => {
      pc.getSenders().forEach((s) => { if (s.track && tracks.includes(s.track)) { try { pc.removeTrack(s); } catch (e) {} } });
    });
    tracks.forEach((t) => t.stop());
    localStreamRef.stream = null;
    micOn = false;
  }

  function leaveAll() {
    [...peers.keys()].forEach(disposePeer);
    dropMic();
  }

  // مؤشر التكلم
  let audioCtx = null, analyser = null, rafId = null;
  function startTalkingIndicator(onLevel) {
    if (!localStreamRef.stream) return;
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      audioCtx.createMediaStreamSource(localStreamRef.stream).connect(analyser);
    }
    const buf = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(buf);
      const avg = buf.reduce((a, b) => a + b, 0) / buf.length;
      onLevel(avg > 10);
      rafId = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(tick);
  }
  function stopTalkingIndicator() { cancelAnimationFrame(rafId); }

  return { init, setMyId, enableMic, disableMic, dropMic, leaveAll, startTalkingIndicator, stopTalkingIndicator, get micOn() { return micOn; } };
})();
