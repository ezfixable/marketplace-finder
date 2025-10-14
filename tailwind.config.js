/** @type {import('tailwindcss').Config} */
export default {
content: [
'./index.html',
'./src/**/*.{js,jsx,ts,tsx}',
],
darkMode: 'class',
theme: {
extend: {
colors: {
primary: '#3B82F6',
secondary: '#9333EA',
success: '#10B981',
warning: '#F59E0B',
error: '#EF4444',
},
fontFamily: {
sans: ['Inter','ui-sans-serif','system-ui'],
display: ['Space Grotesk','ui-sans-serif','system-ui'],
},
},
},
plugins: [],
}
