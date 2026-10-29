import React from 'react';
import {createRoot} from 'react-dom/client';
import { PublicPage,Preview } from './Page';
import Admin from './admin/Admin';
const path=location.pathname;
createRoot(document.getElementById('root')).render(path.startsWith('/admin')?<Admin/>:path==='/preview'?<Preview/>:<PublicPage/>);
