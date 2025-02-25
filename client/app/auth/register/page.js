// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import Link from 'next/link';
// import { api } from '@/lib/api';

// export default function Register() {
//   const router = useRouter();
//   const [formData, setFormData] = useState({
//     email: '',
//     firstName: '',
//     lastName: '',
//     password: ''
//   });
//   const [error, setError] = useState('');

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const res = await api.register({
//         email: formData.email,
//         firstName: formData.firstName,
//         lastName: formData.lastName,
//         password: formData.password
//       });
//       const data = await res.json();
      
//       if (!res.ok) {
//         // Handle both simple error messages and detailed errors
//         throw new Error(data.details || data.error || 'Registration failed');
//       }
      
//       // After successful registration, redirect to login
//       router.push('/auth/login');
//     } catch (err) {
//       setError(err.message);
//     }
//   };

//   return (
//     <>
//       <div>
//         <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
//           Create your account
//         </h2>
//       </div>
//       {error && (
//         <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4" role="alert">
//           <strong className="font-bold">Error: </strong>
//           <span className="block sm:inline">{error}</span>
//         </div>
//       )}
//       <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
//         <div className="rounded-md shadow-sm -space-y-px">
//           <div>
//             <input
//               name="firstName"
//               type="text"
//               required
//               className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
//               placeholder="First Name"
//               value={formData.firstName}
//               onChange={(e) => setFormData({...formData, firstName: e.target.value})}
//             />
//           </div>
//           <div>
//             <input
//               name="lastName"
//               type="text"
//               required
//               className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
//               placeholder="Last Name"
//               value={formData.lastName}
//               onChange={(e) => setFormData({...formData, lastName: e.target.value})}
//             />
//           </div>
//           <div>
//             <input
//               name="email"
//               type="email"
//               required
//               className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
//               placeholder="Email address"
//               value={formData.email}
//               onChange={(e) => setFormData({...formData, email: e.target.value})}
//             />
//           </div>
//           <div>
//             <input
//               name="password"
//               type="password"
//               required
//               className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
//               placeholder="Password"
//               value={formData.password}
//               onChange={(e) => setFormData({...formData, password: e.target.value})}
//             />
//           </div>
//         </div>

//         <div>
//           <button
//             type="submit"
//             className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//           >
//             Register
//           </button>
//         </div>
//       </form>
//       <div className="text-center mt-4">
//         <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-500">
//           Already have an account? Login
//         </Link>
//       </div>
//     </>
//   );
// }

'use client';

import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <RegisterForm />
      </div>
    </div>
  );
}
