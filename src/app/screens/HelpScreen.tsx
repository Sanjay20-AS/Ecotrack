import { useState } from "react";
import { MessageCircle, Mail, Phone, HelpCircle, ChevronDown, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router";
import TopBar from "../components/TopBar";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../components/ui/collapsible";
import { Textarea } from "../components/ui/textarea";
import { supportAPI } from "../services/apiService";
import toast from "react-hot-toast";

export function HelpScreen() {
  const navigate = useNavigate();
  const userId = parseInt(localStorage.getItem("userId") ?? "0");

  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(0);
  const [contactForm, setContactForm] = useState({ subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const faqs = [
    {
      id: 1,
      question: "How do I track my waste?",
      answer:
        "Navigate to the 'Track Waste' screen from the home menu. Enter the waste type, quantity, and location. You can view your waste history anytime from your profile.",
    },
    {
      id: 2,
      question: "How do I find nearby facilities?",
      answer:
        "Go to 'Locations' from the main menu. You'll see a list of waste disposal facilities near you. You can search by name or filter by waste type (e-waste, compost, recycling, etc.).",
    },
    {
      id: 3,
      question: "How do I schedule a waste pickup?",
      answer:
        "After logging waste in the Track Waste screen, you can schedule a pickup time. The facility will contact you to confirm the pickup schedule.",
    },
    {
      id: 4,
      question: "How are achievement badges earned?",
      answer:
        "Badges are earned by completing eco-friendly actions like recycling a certain amount of waste, joining community events, or consistent waste tracking. Check your profile to see your progress towards badges.",
    },
    {
      id: 5,
      question: "Can I edit my profile information?",
      answer:
        "Yes! Go to your Profile screen and click 'Edit Profile'. You can update your name, phone number, and bio. Changes are saved immediately.",
    },
    {
      id: 6,
      question: "How do I join a community?",
      answer:
        "Visit the 'Community' section to see local eco-friendly groups. You can join communities of interest and participate in events and discussions.",
    },
    {
      id: 7,
      question: "Is my personal information safe?",
      answer:
        "Yes, we take data security seriously. Your information is encrypted and stored securely. You can control your privacy settings in the Settings screen.",
    },
    {
      id: 8,
      question: "How do I contact support?",
      answer:
        "You can reach us through this Help screen using the contact form below, or email us at support@ecotrack.com. We typically respond within 24 hours.",
    },
  ];

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.subject.trim() || !contactForm.message.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      await supportAPI.submit({ userId, subject: contactForm.subject.trim(), message: contactForm.message.trim() });
      setSubmitted(true);
      setContactForm({ subject: "", message: "" });
      setTimeout(() => setSubmitted(false), 5000);
    } catch {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <TopBar
        variant="banner"
        title="Help & Support"
        subtitle="FAQs, contact, and resources"
        showBack
        onBack={() => navigate("/app/profile")}
      />

      <div className="mx-auto w-full max-w-lg px-4 py-5 space-y-5">
        {/* Quick Links */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Quick Help</h2>
          <div className="grid grid-cols-2 gap-3">
            <Card
              className="p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => document.getElementById("contact-form-section")?.scrollIntoView({ behavior: "smooth" })}
            >
              <MessageCircle className="h-6 w-6 mx-auto text-primary mb-2" />
              <p className="text-sm font-medium">Chat Support</p>
            </Card>
            <a href="https://mail.google.com/mail/u/0/?view=cm&fs=1&to=support@ecotrack.com" target="_blank" rel="noopener noreferrer">
              <Card className="p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors h-full flex flex-col items-center justify-center">
                <Mail className="h-6 w-6 mx-auto text-primary mb-2" />
                <p className="text-sm font-medium">Email Us</p>
              </Card>
            </a>
            <a href="tel:+918489737878">
              <Card className="p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors h-full flex flex-col items-center justify-center">
                <Phone className="h-6 w-6 mx-auto text-primary mb-2" />
                <p className="text-sm font-medium">Call Us</p>
              </Card>
            </a>
            <Card
              className="p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => document.getElementById("faq-section")?.scrollIntoView({ behavior: "smooth" })}
            >
              <HelpCircle className="h-6 w-6 mx-auto text-primary mb-2" />
              <p className="text-sm font-medium">FAQ</p>
            </Card>
          </div>
        </div>

        {/* FAQs */}
        <div id="faq-section">
          <h2 className="text-lg font-semibold mb-4">Frequently Asked Questions</h2>
          <Card className="divide-y">
            {faqs.map((faq) => (
              <Collapsible
                key={faq.id}
                open={expandedFAQ === faq.id}
                onOpenChange={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors text-left">
                  <span className="font-medium text-sm">{faq.question}</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      expandedFAQ === faq.id ? "rotate-180" : ""
                    }`}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-4 text-sm text-muted-foreground">
                  {faq.answer}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </Card>
        </div>

        {/* Contact Form */}
        <div id="contact-form-section">
          <h2 className="text-lg font-semibold mb-4">Contact Us</h2>
          <Card className="p-6">
            {submitted && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                Thank you! We've received your message and will respond within 24 hours.
              </div>
            )}
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject *</label>
                <Input
                  type="text"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  placeholder="How can we help?"
                  required
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Message *</label>
                <Textarea
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  placeholder="Tell us more details..."
                  required
                  rows={4}
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </Card>
        </div>

        {/* Contact Info */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Get in Touch</h2>
          <Card className="p-6 space-y-4">
            <a href="mailto:support@ecotrack.com" className="flex gap-3 hover:opacity-75 transition-opacity">
              <Mail className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Email</p>
                <p className="text-sm text-muted-foreground">support@ecotrack.com</p>
              </div>
            </a>
            <a href="tel:+918489737878" className="flex gap-3 hover:opacity-75 transition-opacity">
              <Phone className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Phone</p>
                <p className="text-sm text-muted-foreground">+91 8489737878</p>
              </div>
            </a>
            <div
              className="flex gap-3 cursor-pointer hover:opacity-75 transition-opacity"
              onClick={() => document.getElementById("contact-form-section")?.scrollIntoView({ behavior: "smooth" })}
            >
              <MessageCircle className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Live Chat</p>
                <p className="text-sm text-muted-foreground">
                  Available 9 AM - 9 PM IST, 7 days a week
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="text-center text-sm text-muted-foreground pb-6">
          <p>EcoTrack Support Team</p>
          <p>Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
}
