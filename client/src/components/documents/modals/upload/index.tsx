'use client';

import { DepartmentsProps } from '@/types/departments';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { ChevronDown, ChevronRight, Folder, FileText } from 'lucide-react';
import { DocumentUploadModalProps } from '@/types/documents';


export function DocumentUploadModal({ isOpen, onClose }: DocumentUploadModalProps) {

    const router = useRouter();

    const [file, setFile] = useState<File | null>(null);
    const [departments, setDepartments] = useState<DepartmentsProps[]>([]);
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
    const [selectedRestrictedDepartmentIds, setSelectedRestrictedDepartmentIds] = useState<number[]>([]);

    const [openDepartmentId, setOpenDepartmentId] = useState<number | null>(null);


    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);


    useEffect(() => {
        if (!isOpen) {
            setFile(null);
            setSelectedCategoryIds([]);
            setSelectedRestrictedDepartmentIds([]);
            setOpenDepartmentId(null);
            setMessage(null);
            return;
        }

        const fetchDepartments = async () => {
            setLoading(true);
            setMessage(null);

            const token = localStorage.getItem('token');

            if (!token) {
                console.error("Erro: Token de autenticação não encontrado.");
                router.push('/');
                setLoading(false);
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
                    setMessage({ type: 'error', text: 'Erro ao carregar departamentos e categorias.' });
                    onClose();
                    return;
                }

                const data: DepartmentsProps[] = await response.json();
                setDepartments(data);

            } catch (err: any) {
                console.error("Erro na requisição de departamentos:", err);
                setMessage({ type: 'error', text: 'Erro na comunicação com o servidor ao buscar dados.' });
                onClose();
            } finally {
                setLoading(false);
            }
        };

        fetchDepartments();

    }, [isOpen, router]);

    const handleCategoryChange = (categoryId: number, checked: boolean) => {
        setSelectedCategoryIds(prev =>
            checked ? [...prev, categoryId] : prev.filter(id => id !== categoryId)
        );
    };

    const handleRestrictedDepartmentChange = (departmentId: number, checked: boolean) => {
        setSelectedRestrictedDepartmentIds(prev =>
            checked ? [...prev, departmentId] : prev.filter(id => id !== departmentId)
        );
    };

    const handleDepartmentClick = (departmentId: number) => {
        setOpenDepartmentId(openDepartmentId === departmentId ? null : departmentId);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setMessage(null);

        if (!file) {
            setMessage({ type: 'info', text: 'Selecione um arquivo.' });
            return;
        }
        if (selectedCategoryIds.length === 0) {
            setMessage({ type: 'info', text: 'Selecione ao menos uma categoria para o documento.' });
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('categoryIds', JSON.stringify(selectedCategoryIds));
        formData.append('restrictedDepartmentIds', JSON.stringify(selectedRestrictedDepartmentIds));

        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error("Erro: Token de autenticação não encontrado.");
                router.push('/');
                return;
            }

            const response = await fetch('http://localhost:3001/documents/upload', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erro no upload: ${response.status} - ${response.statusText} - ${errorText}`);
            }

            setMessage({ type: 'success', text: 'Documento enviado com sucesso!' });
            setTimeout(() => {
                onClose();
            }, 1500);

        } catch (err: any) {
            console.error("Erro no envio:", err);
            setMessage({ type: 'error', text: `Erro ao enviar o documento: ${err.message || 'Verifique o console.'}` });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50" onClick={onClose}>
            <div className="absolute flex flex-col h-auto w-100 bg-black/10 backdrop-blur-md top-20 left-2/5 rounded-md z-60 p-2 upload" onClick={(e) => e.stopPropagation()}>
                <button
                    className="absolute top-2 right-2 text-xl cursor-pointer"
                    onClick={onClose}
                    aria-label="Fechar Modal"
                >
                    ✕
                </button>

                <h2 className="text-lg font-semibold mb-4">Upload de Documento</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="file-upload" className="block text-sm font-medium mb-1">Selecionar Arquivo</label>
                        <input
                            id="file-upload"
                            type="file"
                            onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                            className="block w-full rounded-md text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-black/10 file:backdrop-blur-md hover:file:bg-black/20 hover:file:backdrop-blur-md files"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Selecionar Categorias</label>
                        <div className="border border-zinc-300 rounded-md p-2 h-40 overflow-y-auto custom-scroll">
                            {departments.map(department => (
                                <div key={department.id} className="flex flex-col mb-2">
                                    <button
                                        type="button"
                                        className="flex items-center w-full text-left p-1 rounded hover:bg-black/5 text-sm font-medium"
                                        onClick={() => handleDepartmentClick(department.id)}
                                    >
                                        {openDepartmentId === department.id ? (
                                            <ChevronDown size={14} className="mr-1" />
                                        ) : (
                                            <ChevronRight size={14} className="mr-1" />
                                        )}
                                        <Folder size={14} className="mr-1" />
                                        {department.name}
                                    </button>

                                    {openDepartmentId === department.id && (
                                        <ul className="ml-6 mt-1 flex flex-col gap-1 text-sm">
                                            {department.categories.length === 0 ? (
                                                <li className="italic p-1">Vazio.</li>
                                            ) : (
                                                department.categories.map(category => (
                                                    <li key={category.id} className="flex items-center p-1 rounded hover:bg-black/5">
                                                        <input
                                                            type="checkbox"
                                                            id={`category-${category.id}`}
                                                            value={category.id}
                                                            checked={selectedCategoryIds.includes(category.id)}
                                                            onChange={(e) => handleCategoryChange(category.id, e.target.checked)}
                                                            className="mr-2"
                                                        />
                                                        <label htmlFor={`category-${category.id}`} className="flex items-center">
                                                            <FileText size={12} className="mr-1" />
                                                            {category.name}
                                                        </label>
                                                    </li>
                                                ))
                                            )}
                                        </ul>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="restricted-department-select" className="block text-sm font-medium mb-1">Restrito aos Departamentos (Opcional)</label>
                        <div className="border border-zinc-300 rounded-md p-2 h-24 overflow-y-auto custom-scroll">
                            {departments.map(dept => (
                                <div key={dept.id} className="flex items-center text-sm mb-1">
                                    <input
                                        type="checkbox"
                                        id={`restrict-${dept.id}`}
                                        value={dept.id}
                                        checked={selectedRestrictedDepartmentIds.includes(dept.id)}
                                        onChange={(e) => handleRestrictedDepartmentChange(dept.id, e.target.checked)}
                                        className="mr-2"
                                    />
                                    <label htmlFor={`restrict-${dept.id}`}>{dept.name}</label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`px-4 py-2 rounded w-full font-semibold 
                             ${loading
                                ? 'bg-black/10 backdrop-blur-md cursor-not-allowed'
                                : 'bg-black/10 backdrop-blur-md hover:bg-black/20 hover:backdrop-blur-md cursor-pointer'
                            }`}
                    >
                        {loading ? 'Enviando...' : 'Enviar'}
                    </button>

                    {message && (
                        <p className={`text-sm text-center mt-2 ${message.type === 'error' ? 'text-red-500' :
                            message.type === 'success' ? 'text-green-600' :
                                'text-zinc-600'
                            }`}>
                            {message.text}
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
};