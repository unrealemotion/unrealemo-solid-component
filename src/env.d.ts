/// <reference types="vite/client" />

// CSS Modules
declare module "*.module.scss" {
  const classes: { [key: string]: string };
  export default classes;
}

declare module "*.module.css" {
  const classes: { [key: string]: string };
  export default classes;
}

// Icons (unplugin-icons)
declare module "~icons/*" {
  import { JSX, Component } from "solid-js";
  const component: Component<JSX.SvgSVGAttributes<SVGSVGElement>>;
  export default component;
}

