'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, Loader } from 'lucide-react';
import { DocumentDetailsProps } from '@/types/documents';
import { useRouter } from 'next/navigation';

interface DocumentViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    documentId: string | null;
    onActionComplete?: () => void;
}

export function DocumentReviewModal({ isOpen, onClose, documentId, onActionComplete }: DocumentViewModalProps) {
    const router = useRouter();

    const [documentData, setDocumentData] = useState<DocumentDetailsProps | null>(null);
    const [documentFileUrl, setDocumentFileUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [isActionLoading, setIsActionLoading] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const [actionSuccess, setActionSuccess] = useState<string | null>(null);


    const resetModalState = useCallback(() => {
        setDocumentData(null);
        setDocumentFileUrl(null);
        setLoading(false);
        setError(null);
        setIsActionLoading(false);
        setActionError(null);
        setActionSuccess(null);
    }, []);

    useEffect(() => {
        if (!isOpen) {
            resetModalState();
        }
    }, [isOpen, resetModalState]);

    const fetchDocumentData = useCallback(async () => {
        if (!documentId || !isOpen) return;

        setLoading(true);
        setError(null);
        setActionError(null);
        setActionSuccess(null);
        setDocumentData(null);
        setDocumentFileUrl(null);

        const token = localStorage.getItem('token');

        if (!token) {
            console.error("Erro: Token de autenticação não encontrado.");
            router.push('/');
            setLoading(false);
            return;
        }

        try {
            const detailsResponse = await fetch(`http://localhost:3001/documents/${documentId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!detailsResponse.ok) {
                const errorBody = await detailsResponse.text();
                const errorMessage = `Erro ao buscar detalhes do documento ${documentId}: ${detailsResponse.status} - ${detailsResponse.statusText}${errorBody ? ` - ${errorBody}` : ''}`;
                console.error(errorMessage);
                if (detailsResponse.status === 404) setError('Documento não encontrado.');
                else if (detailsResponse.status === 403) setError('Você não tem permissão para ver este documento.');
                else setError('Erro ao carregar detalhes do documento.');
                setLoading(false);
                return;
            }
            const detailsData: DocumentDetailsProps = await detailsResponse.json();
            setDocumentData(detailsData);

            const logViewResponse = await fetch(`http://localhost:3001/documents/${documentId}/log-view`, { //
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({})
            });
            if (!logViewResponse.ok) console.error(`Falha ao registrar visualização para documento ${documentId}: ${logViewResponse.status} - ${logViewResponse.statusText}`);
            else console.log(`Visualização do documento ${documentId} registrada.`);

            const signedUrlResponse = await fetch(`http://localhost:3001/documents/${documentId}/signed-url`, { //
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!signedUrlResponse.ok) {
                const errorBody = await signedUrlResponse.text();
                const errorMessage = `Erro ao obter URL assinada para o documento ${documentId}: ${signedUrlResponse.status} - ${signedUrlResponse.statusText}${errorBody ? ` - ${errorBody}` : ''}`;
                console.error(errorMessage);
                if (signedUrlResponse.status === 404) setError('Arquivo do documento não encontrado ou acesso negado (URL assinada).');
                else if (signedUrlResponse.status === 403) setError('Você não tem permissão para obter a URL do arquivo.');
                else setError('Erro ao gerar link de visualização.');
                setLoading(false);
                return;
            }
            const signedUrlData = await signedUrlResponse.json();
            setDocumentFileUrl(signedUrlData.url);

        } catch (err: any) {
            console.error("Erro geral no fetch do documento ou URL assinada:", err);
            setError('Ocorreu um erro inesperado ao carregar o documento.');
        } finally {
            setLoading(false);
        }
    }, [documentId, isOpen, router]);

    useEffect(() => {
        if (isOpen && documentId) {
            fetchDocumentData();
        }
    }, [isOpen, documentId, fetchDocumentData]);


    const handleApprove = async () => {
        if (!documentId) return;

        setIsActionLoading(true);
        setActionError(null);
        setActionSuccess(null);
        const token = localStorage.getItem('token');

        if (!token) {
            setActionError("Token de autenticação não encontrado.");
            setIsActionLoading(false);
            return;
        }

        try {
            const response = await fetch(`http://localhost:3001/documents/${documentId}/approve`, { //
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                setActionError(errorData.message || 'Falha ao aprovar o documento.');
                throw new Error(errorData.message || `Erro ${response.status}`);
            }

            const updatedDocument: DocumentDetailsProps = await response.json();
            setDocumentData(updatedDocument);
            setActionSuccess('Documento aprovado!');
            if (onActionComplete) onActionComplete();
            setTimeout(onClose, 2000);


        } catch (err: any) {
            console.error("Erro ao aprovar documento:", err);
            if (!actionError) setActionError('Ocorreu um erro ao aprovar o documento.');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!documentId) return;

        setIsActionLoading(true);
        setActionError(null);
        setActionSuccess(null);
        const token = localStorage.getItem('token');

        if (!token) {
            setActionError("Token de autenticação não encontrado.");
            setIsActionLoading(false);
            return;
        }

        try {
            const response = await fetch(`http://localhost:3001/documents/${documentId}/reject`, { //
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                setActionError(errorData.message || 'Falha ao reprovar o documento.');
                throw new Error(errorData.message || `Erro ${response.status}`);
            }
            const updatedDocument: DocumentDetailsProps = await response.json();
            setDocumentData(updatedDocument);
            setActionSuccess('Documento reprovado!');
            if (onActionComplete) onActionComplete();
            setTimeout(onClose, 2000);

        } catch (err: any) {
            console.error("Erro ao reprovar documento:", err);
            if (!actionError) setActionError('Ocorreu um erro ao reprovar o documento.');
        } finally {
            setIsActionLoading(false);
        }
    };


    if (!isOpen) return null;

    const canPerformAction = documentData?.status === 'pending' || documentData?.status === 'pending_approval';

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white dark:bg-zinc-800/90 backdrop-blur-md rounded-lg p-6 w-full max-w-4xl h-[80vh] shadow-xl relative flex flex-col z-50 viewer" onClick={(e) => e.stopPropagation()}>

                <button
                    className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                    onClick={onClose}
                    aria-label="Fechar Modal"
                >
                    <X size={24} />
                </button>

                <h2 className="text-xl font-semibold mb-4 border-b border-zinc-200 dark:border-zinc-700 pb-3 pr-10 truncate text-zinc-800 dark:text-zinc-100">
                    {loading ? 'Carregando...' : error ? 'Erro' : documentData?.title || 'Detalhes do Documento'}
                </h2>

                <div className="flex-1 overflow-hidden">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-600 dark:text-zinc-300">
                            <Loader size={40} className="animate-spin mb-2" />
                            <span>Carregando documento...</span>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full text-red-500">
                            <p className="font-semibold mb-2">Falha ao carregar o documento.</p>
                            <p className="text-sm text-center">{error}</p>
                        </div>
                    ) : !documentData ? (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-600 dark:text-zinc-300">
                            Documento não disponível.
                        </div>
                    ) : (
                        <div className="flex h-full">
                            <div className="w-1/3 border-r border-zinc-200 dark:border-zinc-700 pr-4 overflow-y-auto custom-scroll text-sm text-zinc-700 dark:text-zinc-300">
                                <h3 className="font-semibold mb-3 uppercase text-zinc-800 dark:text-zinc-100">Detalhes</h3>
                                <p className='mb-1'><strong>Título:</strong> {documentData.title}</p>
                                <p className='mb-1'><strong>Descrição:</strong> {documentData.description || 'N/A'}</p>
                                <p className='mb-1'><strong>Status:</strong> <span className={`font-medium ${documentData.status === 'approved' ? 'text-green-600' : documentData.status === 'rejected' ? 'text-red-600' : 'text-yellow-500'}`}>{documentData.status}</span></p>
                                <p className='mb-1'><strong>Criado em:</strong> {new Date(documentData.createdAt).toLocaleDateString('pt-BR')}</p>
                                {documentData.uploadedBy && <p className='mb-1'><strong>Criado por:</strong> {documentData.uploadedBy.name}</p>}
                                {documentData.approvedBy && <p className='mb-1'><strong>Aprovado por:</strong> {documentData.approvedBy.name}</p>}


                                {documentData.categories && documentData.categories.length > 0 && (
                                    <div className='mt-3'>
                                        <p className="font-semibold mb-1">Categoria:</p>
                                        <ul className="list-disc list-inside ml-1">
                                            {documentData.categories.map(cat => (
                                                <li key={cat.id} className="text-xs">{cat.name} ({cat.department?.name || 'N/D'})</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {documentData.restrictedToDepartments && documentData.restrictedToDepartments.length > 0 && (
                                    <div className='mt-3'>
                                        <p className="font-semibold mb-1">Restrito a:</p>
                                        <ul className="list-disc list-inside ml-1">
                                            {documentData.restrictedToDepartments.map(dept => (
                                                <li key={dept.id} className="text-xs">{dept.name}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {documentData.versions && documentData.versions.length > 0 && (
                                    <div className='mt-3 mb-40'>
                                        <p className="font-semibold mb-1">Versão:</p>
                                        <p className="text-xs">REV 0{documentData.versions[0]?.version || 'N/A'}</p>
                                    </div>
                                )}

                                {canPerformAction && (
                                    <div className='flex flex-col gap-10'>
                                        <button
                                            onClick={handleApprove}
                                            disabled={isActionLoading}
                                            className='bg-green-600 p-2 rounded-lg text-white hover:bg-green-700 disabled:opacity-50 flex items-center justify-center'
                                        >
                                            {isActionLoading && <Loader size={18} className="animate-spin mr-2" />}
                                            APROVAR DOCUMENTO
                                        </button>
                                        <button
                                            onClick={handleReject}
                                            disabled={isActionLoading}
                                            className='bg-red-600 p-2 rounded-lg text-white hover:bg-red-700 disabled:opacity-50 flex items-center justify-center'
                                        >
                                            {isActionLoading && <Loader size={18} className="animate-spin mr-2" />}
                                            REPROVAR DOCUMENTO
                                        </button>
                                    </div>
                                )}
                                {actionError && <p className="mt-10 text-sm text-red-500 text-center">{actionError}</p>}
                                {actionSuccess && <p className="mt-10 text-sm text-green-600 text-center">{actionSuccess}</p>}

                            </div>

                            <div className="flex-1 ml-4 flex flex-col">
                                <h3 className="font-semibold mb-2 uppercase text-zinc-800 dark:text-zinc-100">Visualizador</h3>
                                {documentFileUrl ? (
                                    <object data={documentFileUrl} title={documentData.title || "Documento"}
                                        className="w-full flex-1 border border-zinc-300 dark:border-zinc-700 rounded-md bg-zinc-100 dark:bg-zinc-900"
                                        style={{ minHeight: '300px' }} type="application/pdf">
                                        <div className="p-4 text-center text-zinc-600 dark:text-zinc-300">
                                            <p>Não foi possível carregar o visualizador de PDF.</p>
                                            <a href={documentFileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                                Clique aqui para abrir em nova aba
                                            </a>.
                                        </div>
                                    </object>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full border border-zinc-300 dark:border-zinc-700 rounded-md bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                                        {loading || isActionLoading ? 'Preparando visualizador...' : 'Visualizador não disponível.'}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}