import test from "node:test";
import assert from "node:assert/strict";
import { authFeatures, isDemoEmail, isReservedTestEmail, verificationAllowed } from "../src/lib/auth-features.ts";
import { authEmailMessage, deliverAuthEmail, deliverGmailEmail, gmailTransportOptions } from "../src/lib/auth-email-transport.ts";

const hosted={BETTER_AUTH_URL:"https://education.example",AUTH_HOSTED_PILOT:"true"};
const email={...hosted,RESEND_API_KEY:"test-key",AUTH_EMAIL_FROM:"Education <noreply@example.com>"};
test("auth capabilities require real configuration; outbox never activates on a hosted origin",()=>{
 assert.equal(authFeatures(hosted).email,false);assert.equal(authFeatures(hosted).google,false);
 assert.equal(authFeatures({...email,AUTH_EMAIL_TEST_MODE:"true",VERCEL:"1"}).outbox,false);
 assert.equal(authFeatures({...email,AUTH_EMAIL_FROM:"Bad\r\nBcc: other@example.com"}).email,false);
 assert.equal(authFeatures({...email,BETTER_AUTH_URL:"https://evil.example/path"}).email,false);
 assert.equal(authFeatures({...hosted,GOOGLE_CLIENT_ID:"one"}).google,false);
 assert.equal(authFeatures({...hosted,GOOGLE_CLIENT_ID:"one",GOOGLE_CLIENT_SECRET:"two"}).google,true);
});
test("only the five explicitly enabled shared demos bypass email verification",()=>{
 const config={...email,AUTH_HOSTED_DEMO_ACCOUNTS:"true"};
 assert.equal(authFeatures(email).requireVerification,true);
 for(let i=1;i<=5;i++)assert.equal(verificationAllowed({email:`qa-demo-0${i}@example.invalid`,emailVerified:false},config),true);
 for(const address of ["qa-demo-06@example.invalid","qa-other@example.invalid","qa-demo-01@example.invalid.evil","student@gmail.com"]){assert.equal(isDemoEmail(address),false);assert.equal(verificationAllowed({email:address,emailVerified:false},config),false);}
 assert.equal(verificationAllowed({email:"qa-demo-01@example.invalid",emailVerified:false},email),false);
 assert.equal(verificationAllowed({email:"student@gmail.com",emailVerified:true},config),true);
});
test("authentication mail permits only the canonical origin and never echoes upstream error bodies",async()=>{
 const message=authEmailMessage({kind:"reset",to:"learner@example.com",url:"https://education.example/api/auth/reset-password/one"},"https://education.example");
 assert.throws(()=>authEmailMessage({kind:"reset",to:"learner@example.com",url:"https://evil.example/api/auth/reset-password/one"},"https://education.example"));
 assert.throws(()=>authEmailMessage({kind:"verify",to:"learner@example.com\r\nBcc:x",url:"https://education.example/api/auth/verify-email"},"https://education.example"));
 let called=false;await deliverAuthEmail(message,{key:"private-test",from:"sender@example.com"},async(url,options)=>{called=true;assert.equal(url,"https://api.resend.com/emails");assert.equal(options.headers.Authorization,"Bearer private-test");assert.deepEqual(JSON.parse(options.body).to,["learner@example.com"]);return new Response(null,{status:200});});assert.ok(called);
 await assert.rejects(deliverAuthEmail(message,{key:"private-test",from:"sender@example.com"},async()=>new Response("secret provider detail",{status:401})),/^(?!.*secret provider detail).*Authentication email delivery failed/s);
});

test("Gmail SMTP is local by default, prefers the test outbox and never exposes credentials", async () => {
 const local={BETTER_AUTH_URL:"http://localhost:3001",AUTH_LOCAL_PILOT:"true"};
 const gmail={...local,GMAIL_USER:"Learner@Gmail.com",GMAIL_APP_PASSWORD:"abcd efgh ijkl mnop"};
 const config=authFeatures(gmail);
 assert.equal(config.email,true);assert.equal(config.emailTransport,"gmail");
 assert.equal(config.gmailUser,"learner@gmail.com");assert.equal(config.emailFrom,"EducationPlatform <learner@gmail.com>");
 assert.equal(config.requireVerification,false);
 assert.equal(authFeatures({...gmail,AUTH_REQUIRE_EMAIL_VERIFICATION:"true"}).requireVerification,true);
 assert.equal(authFeatures({...gmail,VERCEL:"1"}).email,false);
 assert.equal(isReservedTestEmail("qa-auth@example.invalid"),true);
 assert.equal(isReservedTestEmail("learner@gmail.com"),false);
 assert.equal(authFeatures({...gmail,BETTER_AUTH_URL:"https://education.example",AUTH_HOSTED_PILOT:"true"}).email,false);
 assert.equal(authFeatures({...gmail,AUTH_EMAIL_TEST_MODE:"true"}).emailTransport,"outbox");
 assert.equal(authFeatures({...gmail,GMAIL_APP_PASSWORD:"not-an-app-password"}).email,false);
 assert.throws(()=>gmailTransportOptions({user:"learner@gmail.com\r\nBcc:x",appPassword:"abcdefghijklmnop",from:"EducationPlatform <learner@gmail.com>"}));
 const options=gmailTransportOptions({user:"learner@gmail.com",appPassword:"abcd efgh ijkl mnop",from:"EducationPlatform <learner@gmail.com>"});
 assert.equal(options.host,"smtp.gmail.com");assert.equal(options.port,465);assert.equal(options.secure,true);
 assert.equal(options.auth.user,"learner@gmail.com");assert.equal(options.auth.pass,"abcdefghijklmnop");
 const message=authEmailMessage({kind:"verify",to:"learner@example.com",url:"http://localhost:3001/api/auth/verify-email"},"http://localhost:3001");
 let sent;
 await deliverGmailEmail(message,{user:"learner@gmail.com",appPassword:"abcdefghijklmnop",from:"EducationPlatform <learner@gmail.com>"},{sendMail:async mail=>{sent=mail;return {};}});
 assert.deepEqual(sent,{from:"EducationPlatform <learner@gmail.com>",to:"learner@example.com",subject:message.subject,text:message.text});
});

test("hosted Gmail requires explicit opt-in, valid credentials and a clean hosted pilot; verification stays mandatory", () => {
 const credentials={GMAIL_USER:"learner@gmail.com",GMAIL_APP_PASSWORD:"abcdefghijklmnop"};
 const enabled={...hosted,...credentials,VERCEL:"1",AUTH_HOSTED_GMAIL:"true"};
 assert.equal(authFeatures({...hosted,...credentials,VERCEL:"1"}).email,false);
 assert.equal(authFeatures(enabled).emailTransport,"gmail");
 assert.equal(authFeatures(enabled).requireVerification,true);
 assert.equal(authFeatures({...enabled,AUTH_REQUIRE_EMAIL_VERIFICATION:"false"}).requireVerification,true);
 assert.equal(authFeatures({...enabled,AUTH_EMAIL_TEST_MODE:"true"}).outbox,false);
 assert.equal(authFeatures({...enabled,AUTH_EMAIL_TEST_MODE:"true"}).emailTransport,"gmail");
 assert.equal(authFeatures({...enabled,GMAIL_APP_PASSWORD:"invalid"}).email,false);
 assert.equal(authFeatures({...enabled,AUTH_HOSTED_PILOT:"false"}).email,false);
 assert.equal(authFeatures({...enabled,BETTER_AUTH_URL:"http://education.example"}).email,false);
 assert.equal(authFeatures({...enabled,BETTER_AUTH_URL:"https://education.example/path"}).email,false);
 assert.equal(verificationAllowed({email:"learner@gmail.com",emailVerified:false},enabled),false);
 assert.equal(verificationAllowed({email:"qa-demo-01@example.invalid",emailVerified:false},{...enabled,AUTH_HOSTED_DEMO_ACCOUNTS:"true"}),true);
 assert.equal(authFeatures({...enabled,RESEND_API_KEY:"test-key",AUTH_EMAIL_FROM:"sender@example.com"}).emailTransport,"gmail");
});
