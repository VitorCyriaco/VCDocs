'use client';

import { usePathname, useRouter } from "next/navigation";
import { Folder, ChevronRight, ChevronDown, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { DepartmentsProps } from "@/types/departments";

export function SideMenu() {
    const pathname = usePathname();
    const router = useRouter();

    const isLoginPage = pathname === "/";

    const [departments, setDepartments] = useState<DepartmentsProps[]>([]);

    const [openDepartmentId, setOpenDepartmentId] = useState<number | null>(null);

    const handleDepartmentClick = (departmentId: number) => {
        setOpenDepartmentId(openDepartmentId === departmentId ? null : departmentId);
    };


    useEffect(() => {
        if (isLoginPage) {
            return;
        }

        const fetchDepartments = async () => {

            const token = localStorage.getItem('token');

            if (!token) {
                console.error("Erro: Token de autenticação não encontrado.");
                router.push('/');
                return;
            }

            try {
                const response = await fetch("http://localhost:3001/departments", {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    const errorBody = await response.text();
                    const errorMessage = `Erro HTTP: ${response.status} - ${response.statusText}${errorBody ? ` - ${errorBody}` : ''}`;
                    console.error("Erro ao buscar departamentos:", errorMessage);
                } else {
                    const data: DepartmentsProps[] = await response.json();
                    setDepartments(data);
                }


            } catch (err) {
                console.error("Erro na requisição de departamentos:", err);
            }
        };

        fetchDepartments();

    }, [isLoginPage, router]);

    if (isLoginPage) {
        return null;
    }

    return (
        <>
            <div className="fixed h-full w-80 z-40 background">
                <div className="mt-15 p-5">
                    <h5 className="mb-4 font-semibold">Departamentos</h5>
                    <div className="w-full h-[60vh] p-4 overflow-y-auto custom-scroll bg-black/5 backdrop-blur-xl rounded-md departments">
                        <ul className="flex flex-col gap-2">
                            {departments.map((department) => (
                                <li key={department.id} className="flex flex-col">
                                    <button
                                        className="flex items-center justify-between w-full text-left rounded cursor-pointer mb-1"
                                        onClick={() => handleDepartmentClick(department.id)}
                                    >
                                        <span className="flex items-center gap-3">
                                            <Folder size={20} className="mx-1" />
                                            {department.name}
                                        </span>
                                        {openDepartmentId === department.id ? (
                                            <ChevronDown size={20} className="mx-1" />
                                        ) : (
                                            <ChevronRight size={20} className="mx-1" />
                                        )}
                                    </button>

                                    {openDepartmentId === department.id && (
                                        <ul className="ml-6 mt-1 flex flex-col gap-1">
                                            {department.categories.length === 0 ? (
                                                <li className="text-sm italic p-1">Vazio.</li>
                                            ) : (
                                                department.categories.map((category) => (
                                                    <li key={category.id}>
                                                        <button
                                                            className="flex items-center w-full text-left rounded cursor-pointer"
                                                        // onClick={() => router.push(`/documents?categoryId=${category.id}`)}
                                                        >
                                                            <FileText size={16} className="mx-1" />
                                                            <span>{category.name}</span>
                                                        </button>
                                                    </li>
                                                ))
                                            )}
                                        </ul>
                                    )}
                                </li>
                            ))}
                        </ul>

                    </div>
                </div>
            </div>
        </>
    );
}