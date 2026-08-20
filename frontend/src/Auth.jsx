import { useState } from 'react';
import './Auth.css';

export default function Auth({ onLoginSuccess }){
    const [isSignup, setIsSignup] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e){
        e.preventDefault();
        setError('');
        setLoading(true);

        const endpoint = isSignup ? '/api/signup' : '/api/login';
        const body = isSignup ? {name, email, password} : {email, password};

        try{
            const response = await fetch(`http://localhost:3000${endpoint}`, {
                method : 'POST',
                headers : {'Content-Type' : 'application/json'},
                body : JSON.stringify(body)
            });

            const data = await response.json();

            if(!response.ok){
                setError(data.message);
                setLoading(false);
                return;
            }

            if(isSignup) {
                setIsSignup(false);
                setError('');
                setName('');
                setPassword('');
                setLoading(false);
            }else{
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                onLoginSuccess(data.user);
            }
        }catch(err){
            setError("Something went wrong. Is the backend running?");
            setLoading(false);
        }
        console.log('Form submitted:', { isSignup, name, email, password });
    } 

    return(
        <div className='outer-div'>
            <div className='inner-div'>
                <h1 className='title'>MockMate</h1>
                <p className='sub-title'>
                    {isSignup ? 'Create an account to start practicing' : 'Welcome back'}
                </p>

                <form onSubmit={handleSubmit} className='auth-form'>
                    {isSignup && (
                        <input 
                          type='text'
                          placeholder='Full Name'
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className='auth-input'
                          required
                        />
                    )}

                    <input 
                        type='text'
                        placeholder='Email'
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className='auth-input'
                        required
                    />

                    <input 
                        type='text'
                        placeholder='Password'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className='auth-input'
                        required
                    />

                    {error && <p className='auth-error'>{error}</p>}

                    <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                        {loading ? 'Please wait...' : isSignup ? 'Sign Up' : 'Log In'}
                    </button>
                </form>

                <p className='auth-toggle'>
                    {isSignup ? "Already have an account?" : "Don't have an account"}{' '}
                    <span onClick={()=>{ setIsSignup(!isSignup); setError('');}}>
                        {isSignup ? 'Log In' : 'Sign Up'}
                    </span>
                </p>
            </div>
        </div>
    );
}