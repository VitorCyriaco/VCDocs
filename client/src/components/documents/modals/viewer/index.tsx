'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, Loader } from 'lucide-react';
import { DocumentDetailsProps } from '@/types/documents';
import { useRouter } from 'next/navigation';

interface DocumentViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    documentId: string | null;
}

export function DocumentViewModal({ isOpen, onClose, documentId }: DocumentViewModalProps) {
    const router = useRouter();

    const [documentData, setDocumentData] = useState<DocumentDetailsProps | null>(null);
    const [documentFileUrl, setDocumentFileUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setDocumentData(null);
            setDocumentFileUrl(null);
            setLoading(false);
            setError(null);
        }
    }, [isOpen]);

    const fetchDocumentData = useCallback(async () => {
        if (!documentId || !isOpen) return;

        setLoading(true);
        setError(null);
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

                 if (detailsResponse.status === 404) {
                     setError('Documento não encontrado.');
                 } else if (detailsResponse.status === 403) {
                     setError('Você não tem permissão para ver este documento.');
                 } else {
                      setError('Erro ao carregar detalhes do documento.');
                 }
                  setLoading(false);
                  return;
            }

            const detailsData: DocumentDetailsProps = await detailsResponse.json();
            setDocumentData(detailsData);

            const logViewResponse = await fetch(`http://localhost:3001/documents/${documentId}/log-view`, {
                 method: 'POST',
                 headers: {
                     'Authorization': `Bearer ${token}`,
                     'Content-Type': 'application/json',
                 },
                 body: JSON.stringify({})
            });

            if (!logViewResponse.ok) {
                 console.error(`Falha ao registrar visualização para documento ${documentId}: ${logViewResponse.status} - ${logViewResponse.statusText}`);
            } else {
                 console.log(`Visualização do documento ${documentId} registrada.`);
            }

            const signedUrlResponse = await fetch(`http://localhost:3001/documents/${documentId}/signed-url`, {
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

                 if (signedUrlResponse.status === 404) {
                     setError('Arquivo do documento não encontrado ou acesso negado (URL assinada).');
                 } else if (signedUrlResponse.status === 403) {
                      setError('Você não tem permissão para obter a URL do arquivo.');
                 } else {
                     setError('Erro ao gerar link de visualização.');
                 }
                  setLoading(false);
                  return;
            }

            const signedUrlData = await signedUrlResponse.json();
            const fileUrlWithToken = signedUrlData.url;

            setDocumentFileUrl(fileUrlWithToken);

        } catch (err: any) {
            console.error("Erro geral no fetch do documento ou URL assinada:", err);
            setError('Ocorreu um erro inesperado ao carregar o documento.');
        } finally {
            setLoading(false);
        }
    }, [documentId, isOpen, router]);

    useEffect(() => {
        fetchDocumentData();
    }, [fetchDocumentData]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-90" onClick={onClose}>
            <div className="bg-black/20 left-20 backdrop-blur-md rounded-lg p-6 w-full max-w-4xl h-[80vh] shadow-lg relative flex flex-col z-90 viewer" onClick={(e) => e.stopPropagation()}>

                <button
                    className="absolute top-3 right-3 text-2xl"
                    onClick={onClose}
                    aria-label="Fechar Modal"
                >
                    <X size={24} />
                </button>

                <h2 className="text-xl font-semibold mb-4 border-b border-zinc-200 pb-3 pr-10 truncate">
                    {loading ? 'Carregando...' : error ? 'Erro' : documentData?.title || 'Detalhes do Documento'}
                </h2>

                <div className="flex-1 overflow-hidden">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full">
                            <Loader size={40} className="animate-spin mb-2" />
                            <span>Carregando documento...</span>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full text-red-500">
                            <p className="font-semibold mb-2">Falha ao carregar o documento.</p>
                            <p className="text-sm text-center">{error}</p>
                        </div>
                    ) : !documentData ? (
                         <div className="flex flex-col items-center justify-center h-full">
                             Documento não disponível.
                         </div>
                    ) : (
                        <div className="flex h-full">
                            <div className="w-1/3 border-r border-zinc-200 pr-4 overflow-y-auto custom-scroll text-sm">
                                <h3 className="font-semibold mb-2">Detalhes</h3>
                                <p><strong>ID:</strong> {documentData.id}</p>
                                <p><strong>Título:</strong> {documentData.title}</p>
                                <p><strong>Descrição:</strong> {documentData.description || 'N/A'}</p>
                                <p><strong>Status:</strong> {documentData.status}</p>
                                <p><strong>Criado em:</strong> {new Date(documentData.createdAt).toLocaleDateString('pt-BR')}</p>
                                {documentData.uploadedBy && <p><strong>Upload por:</strong> {documentData.uploadedBy.name}</p>}
                                {documentData.approvedBy && <p><strong>Aprovado por:</strong> {documentData.approvedBy.name}</p>}

                                {documentData.categories && documentData.categories.length > 0 && (
                                    <div>
                                        <p className="font-semibold mt-2 mb-1">Categorias:</p>
                                        <ul className="list-disc list-inside">
                                            {documentData.categories.map(cat => (
                                                <li key={cat.id}>{cat.name} ({cat.department?.name || 'Departamento Desconhecido'})</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {documentData.restrictedToDepartments && documentData.restrictedToDepartments.length > 0 && (
                                     <div>
                                        <p className="font-semibold mt-2 mb-1">Restrito a:</p>
                                        <ul className="list-disc list-inside">
                                            {documentData.restrictedToDepartments.map(dept => (
                                                <li key={dept.id}>{dept.name}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {documentData.versions && documentData.versions.length > 0 && (
                                    <div>
                                        <p className="font-semibold mt-2 mb-1">Versões:</p>
                                        <p className="text-xs">Versão atual: {documentData.versions[0]?.version || 'N/A'}</p>
                                         <ul className="list-disc list-inside text-xs mt-1">
                                             {documentData.versions.map(ver => <li key={ver.id}>V{ver.version} - {new Date(ver.createdAt).toLocaleDateString('pt-BR')}</li>)}
                                         </ul>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 ml-4 flex flex-col">
                                <h3 className="font-semibold mb-2">Visualizador</h3>
                                {documentFileUrl ? (
                                    <iframe
                                        src={documentFileUrl}
                                        title={documentData.title}
                                        className="w-full flex-1 border border-zinc-300 rounded-md"
                                        style={{ minHeight: '300px' }}
                                        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                                    >
                                        Seu navegador não suporta iframes.
                                    </iframe>
                                ) : (
                                     <div className="flex flex-col items-center justify-center h-full">
                                          Preparando visualizador...
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