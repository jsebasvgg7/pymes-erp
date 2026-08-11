import { useContext } from "react";
import { AppContext } from "../context/AppContext";

export function useAppContext() {
	const ctx = useContext(AppContext);
	if (!ctx) {
		throw new Error("AppContext no inicializado");
	}
	return ctx;
}

