import logoUrl from "../assets/logoicon.png";
import "./Logo.css";

const normaliseSize = (size) => {
  if (!size) return undefined;
  if (typeof size === "number") {
    return `${size}px`;
  }
  if (typeof size === "string") {
    return size;
  }
  return undefined;
};

export default function Logo({ size, className = "", style, ...props }) {
  const dimension = normaliseSize(size);
  const computedStyle = {
    ...(dimension ? { width: dimension, height: dimension } : {}),
    ...style,
  };

  const classes = ["rentkeeper-logo", className].filter(Boolean).join(" ");

  return (
    <img
      src={logoUrl}
      alt="RentKeeper"
      className={classes}
      style={computedStyle}
      loading="lazy"
      {...props}
    />
  );
}
