
const Data = [
    {
        id: 1,
        reason: "Aprovação",
        title: "IT-Documentaçao",
        vesion: "Rev05",
        user: "Admin"
    },
    {
        id: 2,
        reason: "Revisão",
        title: "IT-Documentaçao",
        vesion: "Rev02",
        user: "Admin"
    },
    {
        id: 3,
        reason: "Revisão",
        title: "IT-Documentaçao",
        vesion: "Rev07",
        user: "Admin"
    },
    {
        id: 4,
        reason: "Aprovação",
        title: "IT-Documentaçao",
        vesion: "Rev04",
        user: "Admin"
    }
]

export function NotificationsModal({ closeModal }: { closeModal: (isOpen: boolean) => void }) {
    return (
        <div className="fixed inset-0 z-50 flex justify-end"
            onClick={() => closeModal(false)}
        >
            <div className="absolute flex flex-col h-50 w-100 rounded-b-md bg-black/10 backdrop-blur-md top-15 right-5 z-60 userLink"
                onClick={(e) => e.stopPropagation()}
            >
                <ul className="flex flex-col gap-3 overflow-y-auto custom-scroll p-2">
                    {Data.map((item =>
                        <button key={item.id} className="cursor-pointer">
                            <li className="bg-black/10 backdrop-blur-md rounded-lg p-2 text-left">
                                <p>Pedido de {item.reason} - {item.title} {item.vesion}</p>
                                <p>Por: {item.user}</p>
                            </li>
                        </button>
                    ))}
                </ul>
            </div>

        </div>
    )
}