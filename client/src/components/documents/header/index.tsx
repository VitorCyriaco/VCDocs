'use client'

import { FilePlus, Eye, Printer, Pencil, Check, Trash2, Download } from "lucide-react"
import { useState } from "react"
import { DocumentUploadModal } from "../modals/upload";

export function DocumentsHeader({ searchTerm, onSearchChange }: any) {

    const [uploadModal, setUploadModal] = useState(false);

    const HandleModal = (upload: boolean) => {
        setUploadModal(upload)
    }

    return (
        <>
            <div className="flex justify-between px-10 p-3 bg-black/10 z-0">
                <span className="flex justify-center items-center gap-10 z-0">
                    <button className="cursor-pointer"><Eye size={25} /></button>
                    <button className="cursor-pointer"><Download size={25} /></button>
                    <button className="cursor-pointer"><Printer size={25} /></button>
                </span>
                <span className="flex justify-center items-center gap-10">
                    <button onClick={() => HandleModal(true)} className="cursor-pointer"><FilePlus size={25} /></button>
                    <button className="cursor-pointer"><Pencil size={25} /></button>
                    <button className="cursor-pointer"><Check size={25} /></button>
                </span>
                <span className="flex justify-center items-center gap-10">
                    <input className="rounded-md p-1 bg-black/10 backdrop-blur-xl text-black"
                        type="text"
                        placeholder="Pesquisa"
                        value={searchTerm}
                        onChange={onSearchChange}
                    />
                    <button className="cursor-pointer"><Trash2 size={25} /></button>
                </span>
            </div>
            {uploadModal && <DocumentUploadModal isOpen={uploadModal} onClose={() => HandleModal(false)} />}
        </>
    )
}