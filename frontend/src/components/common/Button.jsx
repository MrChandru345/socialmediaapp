import { classNames } from "../../utils/helpers";

export default function Button({
  children,
  className,
  icon,
  size = "md",
  type = "button",
  variant = "primary",
  ...props
}) {
  return (
    <button
      className={classNames("button", `button--${variant}`, `button--${size}`, className)}
      type={type}
      {...props}
    >
      {icon ? <span className="material-symbols-outlined">{icon}</span> : null}
      <span>{children}</span>
    </button>
  );
}
