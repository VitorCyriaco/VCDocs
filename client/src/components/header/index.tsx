'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, User } from "lucide-react";
import ThemeChange from "@/components/themeChange";
import { useState } from "react";
import { UserModal } from "./modal/user";
import { useSearch } from '@/context/searchContext';
import { NotificationsModal } from "./modal/notifications";

export function Header() {

    const [notifications, setNotifications] = useState(3)

    const HandleNotification = () => {
        setNotifications(0)
    }

    const pathname = usePathname();
    const isLoginPage = pathname === "/";

    const [userModal, setUserModal] = useState(false);
    const [notificationModal, setNotificationsModal] = useState(false);

    const { searchTerm, setSearchTerm } = useSearch();

    const HandleModal = (user: boolean, notification: boolean) => {
            setUserModal(user);
            setNotificationsModal(notification)
    }

    return (
        <>
            {!isLoginPage &&
                <header className="fixed flex w-full h-15 z-50 background">
                    <div className="flex items-center w-full px-5">
                        <div className="w-1/6">
                            <h1 className="text-lg">VCDocs</h1>
                        </div>
                        <div className="mx-5">
                            <ul className="flex gap-8">
                                <li className="text-md"><Link href='/default'>Início</Link></li>
                                <li className="text-md"><Link href="/tasks">Tarefas</Link></li>
                                <li className="text-md"><Link href="/documents">Documentos</Link></li>
                            </ul>
                        </div>
                        <div className="w-full flex justify-end">
                            <input className="bg-black/10 backdrop-blur-xl text-black w-1/4 h-8 rounded-md p-2"
                                type="text"
                                placeholder="Pesquisa"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="relative mx-5">
                            <button className="cursor-pointer"
                                onClick={() => {HandleNotification(); HandleModal(false, true)}}
                            >
                                {notifications > 0 &&
                                    <span className="flex absolute items-center justify-center left-1/2 w-5 h-5 bg-[red] rounded-full">
                                        <p className="text-right text-white">{notifications}</p>
                                    </span>
                                }

                                <Bell size={25} />
                            </button>
                        </div>
                        <div>
                            <button className="flex items-center justify-center bg-black/10 backdrop-blur-xl w-10 h-10 rounded-full cursor-pointer"
                                onClick={() => HandleModal(true, false)}
                            >
                                <User size={25} />
                            </button>
                        </div>
                        <span className="ml-4">
                            <ThemeChange />
                        </span>
                    </div>
                </header>
            }
            {userModal && !notifications && <UserModal closeModal={() => HandleModal(false, false)} />}
            {notificationModal && !userModal && <NotificationsModal closeModal={() => HandleModal(false, false)} />}
        </>
    )
}