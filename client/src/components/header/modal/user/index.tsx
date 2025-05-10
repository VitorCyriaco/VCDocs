import Link from "next/link";

export function UserModal({ closeModal }: { closeModal: (isOpen: boolean) => void }) {
    return (
        <div className="fixed inset-0 z-50 flex justify-end"
            onClick={() => closeModal(false)}
        >
            <div className="absolute flex flex-col h-68 w-50 bg-black/10 backdrop-blur-md top-15 right-5 rounded-b-md z-60 p-2 userLink"
                onClick={(e) => e.stopPropagation()}
            >
                <span className="mb-3">
                    <h3 className="text-center font-bold">Nome do Usuário</h3>
                    <h5 className="text-center">Departamento</h5>
                </span>
                <ul className="flex flex-col gap-3">
                    <Link href="" onClick={() => closeModal(false)}><li className="flex items-center text-lg bg-black/11 hover:bg-black/15 backdrop-blur-lg h-10 px-2 rounded-md">Perfil</li></Link>
                    <Link onClick={() => closeModal(false)} href=""><li className="flex items-center text-lg bg-black/11 hover:bg-black/15 backdrop-blur-lg h-10 px-2 rounded-md">Permissões</li></Link>
                    <Link onClick={() => closeModal(false)} href=""><li className="flex items-center text-lg bg-black/11 hover:bg-black/15 backdrop-blur-lg h-10 px-2 rounded-md">Configurações</li></Link>
                    <Link onClick={() => closeModal(false)} href="/"><li className="text-center">Sair</li></Link>
                </ul>
            </div>
        </div>
    )
}