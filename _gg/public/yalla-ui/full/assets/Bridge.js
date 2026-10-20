var $bridge = new Object();
$bridge.functionPool = functionPool;
$bridge.call = function(apiName, param) {
    return new Promise(function(resolve, reject) {
            if (!apiName || Object.prototype.toString.call(apiName) != "[object String]") {
                reject({domain:"js", code:1, message:"invalid api"});
                return
            }
            if(param && Object.prototype.toString.call(param) != "[object Object]"){
                reject({domain:"js", code:2, message:"invalid param"});
                return
            }
            function serialize(obj) {
                var type = Object.prototype.toString.call(obj);
                if (type == "[object Function]") {
                    var functionID = $bridge.functionPool.addFunction(obj);
                    var funcObj = new Object();
                    funcObj.functionID = functionID;
                    return funcObj;
                } else if (type == "[object Object]") {
                    Object.keys(obj).map(item => obj[item] = serialize(obj[item]));
                    return obj;
                } else if (type == "[object Array]") {
                    return obj.map(function(item) {return serialize(item);});
                } else {
                    return obj;
                }
            };
            var message = new Object();
            message.bridge = "$bridge";
            message.api = apiName;
            message.params = JSON.stringify(serialize(param));
            message.callback = function(error) {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            };
            var json = JSON.stringify(serialize(message));
            Android.call(json);
    });
};

