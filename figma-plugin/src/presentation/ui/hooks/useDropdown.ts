import { useState, useRef, useEffect, useCallback } from 'react';
import type { UseDropdownReturn } from '../types';

export function useDropdown(initialOpen = false): UseDropdownReturn {
    const [isOpen, setIsOpen] = useState(initialOpen);
    const ref = useRef<HTMLElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [isOpen]);

    const toggle = useCallback(() => setIsOpen(prev => !prev), []);
    const close = useCallback(() => setIsOpen(false), []);

    return { isOpen, setIsOpen, ref, toggle, close };
}
