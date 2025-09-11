import { NavLink } from "react-router-dom";

export const Page404 = () => {
	return (
		<div className="px-10 -my-8">
		<p className="text-[10rem] font-mono text-slate-500">404</p>
		<p className="-my-8 text-2xl">Please <NavLink to="/" className="underline">return to the site</NavLink>.</p>
		</div>
	)
}

