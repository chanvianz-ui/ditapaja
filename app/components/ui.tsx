import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

type BaseProps = HTMLAttributes<HTMLElement>;

function classes(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

export function UiPage({ className, ...props }: BaseProps) {
  return <main className={classes("dt-ui-page", className)} {...props} />;
}

export function UiStack({ className, ...props }: BaseProps) {
  return <div className={classes("dt-ui-stack", className)} {...props} />;
}

export function UiRow({ className, ...props }: BaseProps) {
  return <div className={classes("dt-ui-row", className)} {...props} />;
}

export function UiSurface({ className, ...props }: BaseProps) {
  return <section className={classes("dt-ui-surface", className)} {...props} />;
}

export function UiEyebrow({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={classes("dt-ui-eyebrow", className)} {...props} />;
}

export function UiHeading({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={classes("dt-ui-heading", className)} {...props} />;
}

export function UiCopy({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={classes("dt-ui-copy", className)} {...props} />;
}

type UiButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
};

export function UiButton({ className, variant = "primary", type = "button", ...props }: UiButtonProps) {
  return (
    <button
      type={type}
      className={classes(
        "dt-ui-button",
        variant === "secondary" && "dt-ui-button--secondary",
        variant === "danger" && "dt-ui-button--danger",
        className
      )}
      {...props}
    />
  );
}

export function UiStatus({
  className,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "success" | "danger" }) {
  return (
    <span
      className={classes(
        "dt-ui-status",
        tone === "success" && "dt-ui-status--success",
        tone === "danger" && "dt-ui-status--danger",
        className
      )}
      {...props}
    />
  );
}

export function UiFieldLabel({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={classes("dt-ui-field-label", className)} {...props} />;
}

export function UiInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={classes("dt-ui-input", className)} {...props} />;
}

export function UiSelect({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={classes("dt-ui-select", className)} {...props} />;
}

export function UiTextarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={classes("dt-ui-textarea", className)} {...props} />;
}
