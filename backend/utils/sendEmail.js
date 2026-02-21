import nodemailer from "nodemailer";

export async function sendWelcomeEmail(toEmail, firstName) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: "🌊 Welcome to AquaShield – You're Now a Ocean Guardian!",
    html: `
      <div style="font-family: 'Arial', sans-serif; max-width: 620px; margin: auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        
        <!-- HERO BANNER -->
        <div style="background: linear-gradient(135deg, #0077b6, #00b4d8, #90e0ef); padding: 50px 20px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 42px; margin: 0; letter-spacing: 2px;">🌊 AquaShield</h1>
          <p style="color: #caf0f8; font-size: 16px; margin-top: 8px; font-style: italic;">Guardian of the Deep Blue</p>
          <div style="margin-top: 20px; font-size: 50px;">🐋🐠🦈</div>
        </div>

        <!-- WELCOME MESSAGE -->
        <div style="padding: 40px 30px; background-color: #f0f8ff;">
          <h2 style="color: #0077b6; font-size: 26px;">Hey ${firstName}, Welcome Aboard! 🎉</h2>
          <p style="color: #444; font-size: 15px; line-height: 1.8;">
            You've just joined a powerful movement of <b>ocean guardians</b> fighting against illegal fishing 
            and protecting our precious marine ecosystems. The ocean needed a hero — and you showed up. 🌍
          </p>
        </div>

        <!-- WAVE DIVIDER -->
        <div style="background-color: #f0f8ff; text-align: center; line-height: 0;">
          <svg viewBox="0 0 500 50" preserveAspectRatio="none" style="width:100%; height:50px;">
            <path d="M0,25 C150,50 350,0 500,25 L500,50 L0,50 Z" style="fill:#0077b6;"></path>
          </svg>
        </div>

        <!-- WHAT YOU CAN DO -->
        <div style="background-color: #0077b6; padding: 30px;">
          <h3 style="color: #ffffff; text-align: center; font-size: 20px; margin-bottom: 25px;">⚓ Your Mission Starts Here</h3>
          
          <div style="background-color: rgba(255,255,255,0.1); border-radius: 10px; padding: 15px; margin-bottom: 15px;">
            <p style="color: #ffffff; margin: 0; font-size: 15px;">🎣 <b>Report Illegal Fishing</b> — Spot a violation? Report it instantly and make a difference.</p>
          </div>
          
          <div style="background-color: rgba(255,255,255,0.1); border-radius: 10px; padding: 15px; margin-bottom: 15px;">
            <p style="color: #ffffff; margin: 0; font-size: 15px;">🐟 <b>Explore Species Database</b> — Discover and learn about marine species that need our protection.</p>
          </div>

          <div style="background-color: rgba(255,255,255,0.1); border-radius: 10px; padding: 15px; margin-bottom: 15px;">
            <p style="color: #ffffff; margin: 0; font-size: 15px;">📍 <b>Track Violations</b> — Monitor reported cases and follow up on fishing violations near you.</p>
          </div>

          <div style="background-color: rgba(255,255,255,0.1); border-radius: 10px; padding: 15px;">
            <p style="color: #ffffff; margin: 0; font-size: 15px;">🤝 <b>Join the Community</b> — Connect with fellow ocean guardians around the world.</p>
          </div>
        </div>

        <!-- WAVE DIVIDER 2 -->
        <div style="background-color: #0077b6; text-align: center; line-height: 0;">
          <svg viewBox="0 0 500 50" preserveAspectRatio="none" style="width:100%; height:50px;">
            <path d="M0,25 C150,0 350,50 500,25 L500,50 L0,50 Z" style="fill:#f0f8ff;"></path>
          </svg>
        </div>

        <!-- DID YOU KNOW -->
        <div style="background-color: #f0f8ff; padding: 30px; text-align: center;">
          <h3 style="color: #0077b6;">🌐 Did You Know?</h3>
          <p style="color: #555; font-size: 14px; line-height: 1.8; font-style: italic;">
            Over <b>26 million tons</b> of fish are caught illegally every year, costing the global economy 
            up to <b>$23 billion</b> annually. Your reports through AquaShield directly help combat this crisis.
          </p>
        </div>

        <!-- CALL TO ACTION -->
        <div style="padding: 20px 30px 40px; text-align: center; background-color: #f0f8ff;">
          <a href="#" style="background: linear-gradient(135deg, #0077b6, #00b4d8); color: white; padding: 15px 40px; border-radius: 30px; text-decoration: none; font-size: 16px; font-weight: bold; display: inline-block;">
            🌊 Start Protecting the Ocean
          </a>
        </div>

        <!-- FOOTER -->
        <div style="background-color: #023e8a; padding: 25px; text-align: center;">
          <p style="color: #90e0ef; font-size: 13px; margin: 0;">Together we protect what we love. 🌊</p>
          <p style="color: #90e0ef; font-size: 13px; margin: 5px 0;"><b>The AquaShield Team</b></p>
          <p style="color: #555e7a; font-size: 11px; margin-top: 15px;">© 2026 AquaShield. All rights reserved.</p>
        </div>

      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}