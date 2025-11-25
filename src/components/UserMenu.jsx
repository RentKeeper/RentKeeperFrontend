import { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User, LogOut, CalendarCheck, ClipboardList, UserCog } from "lucide-react";
import Cookies from "js-cookie";
import "./UserMenu.css";
import { getUserIdFromToken } from "../utils/jwt";

const resolveToken = () => {
	if (typeof window === "undefined") return null;
	return (
		Cookies.get("token") ||
		localStorage.getItem("token") ||
		sessionStorage.getItem("token") ||
		null
	);
};

export default function UserMenu() {
	const navigate = useNavigate();
	const location = useLocation();
	const [open, setOpen] = useState(false);
	const [token] = useState(() => resolveToken());

	const userId = useMemo(() => {
		if (!token) return null;
		return getUserIdFromToken(token);
	}, [token]);

	const toggleMenu = () => setOpen((prev) => !prev);

	const goTo = (path) => {
		setOpen(false);
		if (location.pathname !== path) {
			navigate(path);
		}
	};

	const handleLogout = () => {
		Cookies.remove("token");
		localStorage.removeItem("token");
		sessionStorage.removeItem("token");
		setOpen(false);
		navigate("/login");
	};

	return (
		<div className="user-menu">
			<button type="button" className="user-menu-trigger" onClick={toggleMenu}>
				<User size={18} />
			</button>
			{open && (
				<div className="user-menu-dropdown">
					<button type="button" className="user-menu-item" onClick={() => goTo("/perfil")}>
						<UserCog size={16} />
						<span>Perfil</span>
					</button>
					<button type="button" className="user-menu-item" onClick={() => goTo("/reservas-jogador")}>
						<CalendarCheck size={16} />
						<span>Reservas recebidas</span>
					</button>
					<button type="button" className="user-menu-item" onClick={() => goTo("/minhas-contratacoes")}>
						<ClipboardList size={16} />
						<span>Minhas contratações</span>
					</button>
					<button type="button" className="user-menu-item" onClick={handleLogout}>
						<LogOut size={16} />
						<span>Sair</span>
					</button>
				</div>
			)}
		</div>
	);
}
