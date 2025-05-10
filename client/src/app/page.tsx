'use client';

import { useState, useEffect } from "react";
import { useRouter, usePathname } from 'next/navigation';

export default function Home() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {

        if (pathname === "/") {
           localStorage.removeItem('token');
           localStorage.removeItem('user');
           localStorage.removeItem('companyId');
        }

        return () => {};

    }, [pathname]);

    const HandleSubmit = async (event: any) => {
        event.preventDefault();

        setError('');
        setLoading(true);

        try {
            const response = await fetch('http://localhost:3001/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            setLoading(false);

            if (!response.ok) {
                const errorData = await response.json();
                setError("Email e/ou senha incorretos!");
                return;
            }

            const data = await response.json();
            localStorage.setItem('token', data.access_token);

            router.push('/default');

        } catch (err) {
            setLoading(false);
            setError('Tente novamente mais tarde.');
        }
    };

    return (
        <div className="flex h-[100vh] w-full items-center justify-center">
            <div className="w-1/2 bg-[blue] h-[100%] flex flex-col items-center justify-center text-white">
                <h1>VCDocs</h1>
            </div>
            <div className="w-1/2 h-[100%] flex items-center justify-center">
                <form className="flex flex-col w-full items-center justify-center" onSubmit={HandleSubmit}>

                    <h2 className="text-2xl mb-6">Fazer Login</h2>

                    <label className="self-start ml-[25%]" htmlFor="email">Email:</label>
                    <input
                        className="w-1/2 h-10 border-1 rounded-md p-2 mb-5"
                        type="email"
                        id="email"
                        placeholder="Digite seu email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <label className="self-start ml-[25%]" htmlFor="password">Senha:</label>
                    <input
                        className="w-1/2 h-10 border-1 rounded-md p-2 mb-5"
                        type="password"
                        id="password"
                        placeholder="Digite sua senha"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    {error && <p className="text-red-500 mb-4">{error}</p>}

                    <button
                        className="bg-[green] w-1/5 h-10 rounded-md text-white disabled:opacity-50"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>
            </div>
        </div>
    );
}