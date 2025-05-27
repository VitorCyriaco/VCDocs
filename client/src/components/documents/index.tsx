'use client'

import { useEffect, useMemo, useState } from "react";
import { DocumentsHeader } from "./header";
import { Star, BadgeCheck, ChevronLeft, ChevronRight, File } from "lucide-react";
import router from "next/router";
import { DocumentsProps } from "@/types/documents";
import { DocumentViewModal } from "./modals/viewer";
import { DocumentReviewModal } from "./modals/review";

export function DocumentsPage() {

    const [documents, setDocuments] = useState<DocumentsProps[]>([])

    useEffect(() => {
        const fetchDocuments = async () => {

            const token = localStorage.getItem('token');

            if (!token) {
                console.error("Erro: Token de autenticação não encontrado.");
                router.push('/');
                return;
            }

            try {
                const response = await fetch("http://localhost:3001/documents/all", {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    const errorBody = await response.text();
                    throw new Error(`Erro HTTP: ${response.status} - ${response.statusText} - ${errorBody}`);
                }

                const data: DocumentsProps[] = await response.json();
                setDocuments(data);

            } catch (err: any) {
                console.error("Erro ao buscar departamentos:", err);
            };
        }
        fetchDocuments();
    }, [])

    const [searchTerm, setSearchTerm] = useState('');

    const filteredData = useMemo(() => {
        if (!searchTerm) {
            return documents;
        }
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return documents.filter(item =>
            item.title.toLowerCase().includes(lowerCaseSearchTerm) ||
            item.description?.toLowerCase().includes(lowerCaseSearchTerm)
        );
    }, [documents, searchTerm]);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    const currentData = filteredData.slice(startIndex, endIndex);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    const handleSearchChange = (event: any) => {
        setSearchTerm(event.target.value);
        setCurrentPage(1);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(prevPage => prevPage + 1);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(prevPage => prevPage - 1);
        }
    };

    const [reviewModal, setReviewModal] = useState(false)

    const [viewerModal, setViewerModal] = useState(false)
    const [docId, setDocId] = useState("")

    return (
        <>
            <div className="h-full z-0 border-t-1 border-l-1 border-zinc-300 background">
                <div>
                    <DocumentsHeader
                        searchTerm={searchTerm}
                        onSearchChange={handleSearchChange}
                    />
                </div>
                <div className="px-2 mt-2">
                    <div className="flex flex-col bg-black/10 p-2 w-full border-1 border-black/20 rounded-t-md">
                        <div><h3 className="text-center">Departamento</h3></div>
                        <div className="flex items-center mt-2 w-full">
                            <input className="w-4 h-4" type="checkbox" />
                            <ul className="grid grid-cols-20 ml-3 w-full justify-center">
                                <li className="flex border-x-1 border-black/20 justify-center col-span-1 self-center"><File size={20} /></li>
                                <li className="border-r-1 border-black/20 text-center col-span-6">Título</li>
                                <li className="border-r-1 border-black/20 text-center col-span-8">Descrição</li>
                                <li className="border-r-1 border-black/20 text-center col-span-2">Data</li>
                                <li className="border-r-1 border-black/20 text-center col-span-1">Rev</li>
                                <li className="border-r-1 border-black/20 flex justify-center col-span-1"><Star size={20} /></li>
                                <li className="flex justify-center col-span-1"><BadgeCheck size={20} /></li>
                            </ul>
                        </div>
                    </div>
                    <div className="flex flex-col p-2 w-full border-1 border-black/20">
                        {currentData.map((item) => {
                            const dateObj = new Date(item.createdAt);
                            const day = dateObj.getDate();
                            const month = dateObj.getMonth() + 1;
                            const year = dateObj.getFullYear();

                            const formattedDay = day < 10 ? '0' + day : day;
                            const formattedMonth = month < 10 ? '0' + month : month;

                            const formattedDate = `${formattedDay}/${formattedMonth}/${year}`;
                            return (
                                <div key={item.id} className="flex items-center mt-2 w-full mb-1">
                                    <input className="w-4 h-4" type="checkbox" />
                                    <ul className="grid grid-cols-20 ml-3 w-full justify-center">
                                        <li className="flex border-x-1 border-black/20 justify-center col-span-1 self-center"><button className="cursor-pointer" onClick={() => { setViewerModal(true); setDocId(item.id) }}><File size={20} /></button></li>
                                        <li className="px-2 border-r-1 border-black/20 col-span-6 truncate">{item.title}</li>
                                        <li className="px-2 border-r-1 border-black/20 col-span-8 truncate">{item.description}</li>
                                        <li className="border-r-1 border-black/20 text-center col-span-2 truncate">{formattedDate}</li>
                                        <li className="border-r-1 border-black/20 text-center col-span-1 truncate">{ }</li>
                                        <li className="border-r-1 border-black/20 col-span-1 flex justify-center"><button className="cursor-pointer"><Star size={20} /></button></li>
                                        {item.status === "pending" &&
                                            <li className="flex justify-center col-span-1 self-center"><button className="cursor-pointer"><BadgeCheck onClick={() => { setReviewModal(true); setDocId(item.id) }} size={20} /></button></li>
                                        }
                                        {item.status === "approved" &&
                                            <li className="flex justify-center col-span-1 self-center"><BadgeCheck size={20} color="green" /></li>
                                        }
                                        {item.status === "rejected" &&
                                            <li className="flex justify-center col-span-1 self-center"><BadgeCheck size={20} color="red" /></li>
                                        }
                                    </ul>
                                </div>
                            )
                        })
                        }
                    </div>
                    <div className="flex justify-between bg-black/10 p-2 w-full border-1 border-black/20 rounded-b-md">
                        <span><p>{filteredData.length} documentos encontrados</p></span>

                        <span className="flex gap-8">
                            <p>Página {currentPage} de {totalPages}</p>
                            <button className="cursor-pointer" onClick={handlePreviousPage}><ChevronLeft size={25} /></button>
                            <button className="cursor-pointer" onClick={handleNextPage}><ChevronRight size={25} /></button>
                        </span>

                    </div>
                </div>
            </div>
            {viewerModal && <DocumentViewModal isOpen={viewerModal} onClose={() => setViewerModal(false)} documentId={docId} />}

            {reviewModal && <DocumentReviewModal isOpen={reviewModal} onClose={() => setReviewModal(false)} documentId={docId} />}
        </>
    )
}