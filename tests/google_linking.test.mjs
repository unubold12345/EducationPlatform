import test from 'node:test';
import assert from 'node:assert/strict';
import { betterAuth } from 'better-auth/minimal';
import { memoryAdapter } from 'better-auth/adapters/memory';
import { generateKeyPair, SignJWT } from 'jose';
import { accountLinkingPolicy, validateGoogleIdentity } from '../src/lib/auth-account-policy.ts';

// In-memory auth with a locally signed Google-shaped identity, never real provider credentials.
async function fixture(verified) {
 const now=new Date();
 const db={user:[{id:'existing-learner',email:'qa-google@example.invalid',name:'Existing learner',emailVerified:verified,createdAt:now,updatedAt:now}],account:[{id:'password-account',userId:'existing-learner',providerId:'credential',accountId:'existing-learner',password:'unchanged-password-hash',createdAt:now,updatedAt:now}],session:[],verification:[]};
 const auth=betterAuth({baseURL:'http://localhost:3999',secret:'in-memory-qa-secret-with-at-least-32-characters',database:memoryAdapter(db),account:{accountLinking:accountLinkingPolicy},user:{validateUserInfo:validateGoogleIdentity},socialProviders:{google:{clientId:'qa-client',clientSecret:'qa-only',requireEmailVerification:true}},logger:{disabled:true},rateLimit:{enabled:false}});
 const {publicKey,privateKey}=await generateKeyPair('RS256');
 const ctx=await auth.$context;
 const provider=ctx.socialProviders.find(p=>p.id==='google');
 provider.idToken.jwks=async()=>publicKey;
 async function token(emailVerified=true,email='qa-google@example.invalid') {
  return new SignJWT({email,email_verified:emailVerified,name:'Google learner'}).setProtectedHeader({alg:'RS256',kid:'qa'}).setSubject('google-identity-123').setIssuer('https://accounts.google.com').setAudience('qa-client').setIssuedAt().setExpirationTime('5m').sign(privateKey);
 }
 return {auth,db,ctx,token};
}

test('verified same-email Google sign-in keeps the existing account and password',async()=>{
 const {auth,db,token}=await fixture(true);
 const result=await auth.api.signInSocial({body:{provider:'google',idToken:{token:await token()}}});
 assert.equal(result.user.id,'existing-learner');assert.equal(db.user.length,1);
 assert.equal(db.account.length,2);assert.equal(db.account.find(a=>a.providerId==='google').userId,'existing-learner');
 assert.equal(db.account.find(a=>a.providerId==='credential').password,'unchanged-password-hash');
});

test('unverified existing email cannot be silently linked or receive a Google session',async()=>{
 const {auth,db,token}=await fixture(false);
 await assert.rejects(auth.api.signInSocial({body:{provider:'google',idToken:{token:await token()}}}),e=>e.body?.code==='OAUTH_LINK_ERROR');
 assert.equal(db.account.length,1);assert.equal(db.session.length,0);assert.equal(db.user[0].emailVerified,false);
});

test('Google must report a verified email even for an already verified local user',async()=>{
 const {auth,db,token}=await fixture(true);
 await auth.api.signInSocial({body:{provider:'google',idToken:{token:await token()}}});
 await assert.rejects(auth.api.signInSocial({body:{provider:'google',idToken:{token:await token(false)}}}),e=>e.body?.code==='email_not_verified');
 assert.equal(db.account.length,2);assert.equal(db.session.length,1);
});

test('explicit linking accepts verified same-email Google and rejects different or unverified identities',async()=>{
 const { linkOAuthAccount }=await import('../node_modules/better-auth/dist/oauth2/link-account.mjs');
 for(const [email,verified,expected] of [['qa-google@example.invalid',true,true],['other@example.invalid',true,false],['qa-google@example.invalid',false,false]]) {
  const {ctx,db}=await fixture(false);
  const result=await linkOAuthAccount({context:ctx},{link:{userId:'existing-learner',email:'qa-google@example.invalid'},userInfo:{id:'google-identity-123',email,emailVerified:verified,name:'Google learner'},account:{providerId:'google',accountId:'google-identity-123'},profile:{},scopes:[]});
  assert.equal(result.linked,expected);assert.equal(db.account.length,expected?2:1);assert.equal(db.user.length,1);
 }
});
