import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";


const Dropdown = ({
  trigger,
  children,
  align = "right",
  matchWidth = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({});
  const [placement, setPlacement] = useState("bottom");
  const triggerRef = useRef(null);

  const dropdownId = useRef(Math.random().toString(36).substr(2, 9)).current;

  const toggleOpen = (e) => {
    e.stopPropagation();

    if (!isOpen) {
      document.dispatchEvent(
        new CustomEvent("ui:dropdown:open", { detail: dropdownId })
      );

      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const spaceBelow = viewportHeight - rect.bottom;
        const menuHeightEstimate = 220;

        const shouldOpenUp =
          align === "top" ||
          (spaceBelow < menuHeightEstimate && rect.top > spaceBelow);

        const newCoords = {
          left: rect.left,
          width: matchWidth ? rect.width : "auto",
        };

        let transform = "none";
        if (align === "right") {
          newCoords.left = rect.right;
          transform = "translateX(-100%)";
        }

        newCoords.transform = transform;

        if (shouldOpenUp) {
          newCoords.bottom = viewportHeight - rect.top + 6;
          setPlacement("top");
        } else {
          newCoords.top = rect.bottom + 6;
          setPlacement("bottom");
        }

        setCoords(newCoords);
      }
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleGlobalClick = () => setIsOpen(false);
    const handleOtherOpen = (e) => {
      if (e.detail !== dropdownId) setIsOpen(false);
    };

    if (isOpen) {
      window.addEventListener("click", handleGlobalClick);
      window.addEventListener("scroll", handleGlobalClick, true);
      window.addEventListener("resize", handleGlobalClick);
      document.addEventListener("ui:dropdown:open", handleOtherOpen);
    }

    return () => {
      window.removeEventListener("click", handleGlobalClick);
      window.removeEventListener("scroll", handleGlobalClick, true);
      window.removeEventListener("resize", handleGlobalClick);
      document.removeEventListener("ui:dropdown:open", handleOtherOpen);
    };
  }, [isOpen, dropdownId]);

  return (
    <>
      <div
        ref={triggerRef}
        onClick={toggleOpen}
        className="block w-full cursor-pointer relative"
      >
        {trigger}
      </div>

      {isOpen &&
        createPortal(
          <div
            className={`fixed z-[9999] bg-white rounded-xl shadow-xl border border-zinc-100 min-w-[160px] 
              ${
                placement === "top"
                  ? "origin-bottom animate-in slide-in-from-bottom-2"
                  : "origin-top animate-in slide-in-from-top-2"
              } 
              fade-in zoom-in-95 duration-100`}
            style={{
              top: coords.top,
              bottom: coords.bottom,
              left: coords.left,
              width: coords.width,
              transform: coords.transform,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="py-1">
              {typeof children === "function"
                ? children({ close: () => setIsOpen(false) })
                : children}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default Dropdown;