import { useState, useCallback } from 'react';
export function useToast() {
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((message, type='default', ms=3200) => {
    const id = Date.now();
    setToasts(p=>[...p,{id,message,type}]);
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),ms);
  },[]);
  return { toasts, toast };
}
