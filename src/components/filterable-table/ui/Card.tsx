import { JSXElement, ParentProps, splitProps } from "solid-js";
import styles from "./Card.module.scss";

export interface CardProps extends ParentProps {
	class?: string;
}

export function Card(props: CardProps): JSXElement {
	const [local, rest] = splitProps(props, ["class", "children"]);

	const classes = (): string => {
		const cls = [styles.card];
		if (local.class) cls.push(local.class);
		return cls.join(" ");
	};

	return (
		<div class={classes()} {...rest}>
			{local.children}
		</div>
	);
}

