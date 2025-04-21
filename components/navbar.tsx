import Image from 'next/image';

export default function Navbar() {
 return (
    <nav className="flex items-center justify-between p-4 bg-gray-800 text-white w-full h-20">
        <div className='flex items-center justify-between w-full mx-4'>
            <div className="text-lg font-bold">
                <a href="/" >          
                    <Image 
                            src="/logo.png" 
                            alt="Logo" 
                            width={240} 
                            height={240} 
                            priority
                        />
                </a>
            </div>
            <div className="flex gap-10 items-center text-lg font-medium text-gray-100">
                <a
                    href="/aboutus"
                    className="transition-colors duration-200 hover:text-blue-400 text-2xl"
                >
                    About
                </a>
                <a
                    href="/contact"
                    className="transition-colors duration-200 hover:text-blue-400 text-2xl"
                    >
                    Contact
                </a>
                
            </div>

        </div>
    </nav>
      )
}