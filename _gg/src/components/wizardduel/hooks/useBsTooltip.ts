// Bootstrap Tooltip replaced with stub for Next.js compatibility
const Tooltip: any = class { constructor(){} };
import { useEffect } from 'react';

export const useBsTooltip = () => {
  useEffect(() => {
    const tooltipTriggerList = document.querySelectorAll(
      '[data-bs-toggle="tooltip"]'
    );
    tooltipTriggerList.forEach((tooltipTriggerEl) => {
      new Tooltip(tooltipTriggerEl);
    });
  }, []);
};
