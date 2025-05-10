'use client'

import { Eye, Printer, Check, Trash2, Download } from "lucide-react"

export function TasksHeader() {

    return (
        <>
            <div className="flex justify-between px-10 p-3 bg-black/10 z-0">
                <span className="flex justify-center items-center gap-10 z-0">
                    <button className="cursor-pointer"><Eye size={25} /></button>
                    <button className="cursor-pointer"><Download size={25} /></button>
                    <button className="cursor-pointer"><Printer size={25} /></button>
                </span>
                <span className="flex justify-center items-center gap-10">
                    <button className="cursor-pointer"><Check size={25} /></button>
                </span>
                <span className="flex justify-center items-center gap-10">
                    <input className="rounded-md p-1 bg-black/10 backdrop-blur-xl text-black"
                        type="text"
                        placeholder="Pesquisa"
                    />
                    <button className="cursor-pointer"><Trash2 size={25} /></button>
                </span>
            </div>
        </>
    )
}