import { File, Bookmark } from "lucide-react"
import Link from "next/link"

export function HomePage() {
    return (
        <div className="bg-[#E1E1E1] h-full z-0">
            <div>
                <h1 className="absolute left-1/2 top-1/2">Bem Vindo ao VCDocs</h1>
            </div>
            <div className="flex justify-end gap-5 p-5 z-1">
                <Link href="/documents">
                    <div className="flex flex-col items-center justify-center bg-white/80 hover:bg-white/50 backdrop-blur-xl w-60 h-60 rounded-lg card">
                        <File size={60} className="mb-6" />
                        <h3 className="text-4xl">Documentos</h3>
                    </div>
                </Link>

                <Link href="/tasks">
                    <div className="flex flex-col items-center justify-center bg-white/80 hover:bg-white/50 backdrop-blur-xl w-60 h-60 rounded-lg card">
                        <Bookmark size={60} className="mb-6" />
                        <h3 className="text-4xl">Tarefas</h3>
                    </div>
                </Link>
            </div>
        </div>
    )
}