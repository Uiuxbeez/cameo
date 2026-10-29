export async function api(path, options={}) {
 const response=await fetch(`/api${path}`,{credentials:'same-origin',...options,headers:{...(!(options.body instanceof FormData)?{'Content-Type':'application/json'}:{}),...options.headers}});
 const data=await response.json().catch(()=>({error:'The API is unavailable.'}));
 if(!response.ok){const error=new Error(data.error || 'Request failed.');error.status=response.status;throw error;}
 return data;
}
