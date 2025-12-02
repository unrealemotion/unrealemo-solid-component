import { JSXElement, ParentProps, splitProps } from "solid-js";
import styles from "./Button.module.scss";

export type ButtonColor = "primary" | "secondary" | "success" | "danger" | "warning" | "info";
export type ButtonVariant = "solid" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ParentProps {
	color?: ButtonColor;
	variant?: ButtonVariant;
	size?: ButtonSize;
	disabled?: boolean;
	type?: "button" | "submit" | "reset";
	class?: string;
	title?: string;
	startIcon?: JSXElement;
	endIcon?: JSXElement;
	onClick?: (e: MouseEvent) => void;
}

export function Button(props: ButtonProps): JSXElement {
	const [local, rest] = splitProps(props, [
		"color",
		"variant",
		"size",
		"disabled",
		"class",
		"startIcon",
		"endIcon",
		"children",
	]);

	const classes = (): string => {
		const cls = [styles.btn];
		cls.push(styles[`btn-${local.color || "primary"}`]);
		cls.push(styles[`btn-${local.variant || "solid"}`]);
		cls.push(styles[`btn-${local.size || "md"}`]);
		if (local.disabled) cls.push(styles["btn-disabled"]);
		if (local.class) cls.push(local.class);
		return cls.join(" ");
	};

	return (
		<button class={classes()} disabled={local.disabled} {...rest}>
			{local.startIcon && <span class={styles["btn-icon"]}>{local.startIcon}</span>}
			{local.children}
			{local.endIcon && <span class={styles["btn-icon"]}>{local.endIcon}</span>}
		</button>
	);
}

