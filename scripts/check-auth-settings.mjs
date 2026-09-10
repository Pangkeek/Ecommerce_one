const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const response=await fetch(`${url}/auth/v1/settings`,{headers:{apikey:key},signal:AbortSignal.timeout(10000)});
if(!response.ok){console.error(`Auth settings check failed: HTTP ${response.status}`);process.exitCode=1;}
else {
 const data=await response.json();
 console.log(JSON.stringify({emailEnabled:data.external?.email,signupDisabled:data.disable_signup,emailAutoConfirm:data.mailer_autoconfirm}));
 if(data.mailer_autoconfirm){console.error("Email confirmation must be enabled before using email-based admin access.");process.exitCode=1;}
}
