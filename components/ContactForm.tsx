import { useState } from 'react';

const ContactForm = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement form submission logic here
    alert('Form submitted');
  };

  return (
    <div className="contact-landing" id="contact">
      <h1>Contact Us</h1>
      <div className="border"></div>
      <form className="contact-form" onSubmit={handleSubmit}>
        <input type="text" id="name" className="contact-form-text" placeholder="Your name" value={formData.name} onChange={handleChange} />
        <input type="email" id="email" className="contact-form-text" placeholder="Your email" value={formData.email} onChange={handleChange} />
        <input type="text" id="phone" className="contact-form-text" placeholder="Your phone" value={formData.phone} onChange={handleChange} />
        <textarea id="message" className="contact-form-text" placeholder="Your message" value={formData.message} onChange={handleChange}></textarea>
        <button id="btn" className="contact-form-btn">Submit</button>
      </form>
    </div>
  );
};

export default ContactForm;