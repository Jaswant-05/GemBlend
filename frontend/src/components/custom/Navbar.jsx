import { SignInButton, UserButton, useUser } from '@clerk/clerk-react';
import { Button } from '../ui/button';
import { Link } from 'react-router';

function Navbar() {
    const { user } = useUser();
    return (
        <nav className="flex w-full items-center justify-between border-t border-b border-neutral-200 px-4 py-4 dark:border-neutral-800">
            <div className="flex items-center">
                <Link to="/" className="flex items-center">
                    <img
                        src="/logo.png"
                        alt="Logo"
                        className="w-50 h-auto object-contain"
                    />
                </Link>
            </div>
            {!user ? (
                <SignInButton mode="modal">
                    <Button variant="slate" className="cursor-pointer w-24 md:w-32 font-light whitespace-nowrap hover:-translate-y-0.5">
                        Log in
                    </Button>
                </SignInButton>
            ) : (
                <div className='flex items-center gap-5'>
                    <Link to="/create-object">
                        <Button variant="slate" className="cursor-pointer font-light whitespace-nowrap hover:-translate-y-0.5">Create Object</Button>
                    </Link>
                    <Button variant="slate" className="cursor-pointer font-light whitespace-nowrap hover:-translate-y-0.5">My Objects</Button>
                    <UserButton />
                </div>
            )}
        </nav>
    );
}

export default Navbar;