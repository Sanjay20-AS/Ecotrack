import { useState } from "react";
import { ArrowLeft, MessageCircle, Mail, Phone, HelpCircle, ChevronDown } from "lucide-react";
import { Link } from "react-router";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../components/ui/collapsible";

export function HelpScreen() {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(0);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

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

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Contact form submitted:", contactForm);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setContactForm({ name: "", email: "", subject: "", message: "" });
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-6 pt-8 pb-6">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/app/profile" className="hover:opacity-80">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-2xl font-bold">Help & Support</h1>
        </div>
        <p className="text-sm opacity-90">
          Get answers to common questions or contact our support team
        </p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Quick Links */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Quick Help</h2>
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors">
              <MessageCircle className="h-6 w-6 mx-auto text-primary mb-2" />
              <p className="text-sm font-medium">Chat Support</p>
            </Card>
            <Card className="p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors">
              <Mail className="h-6 w-6 mx-auto text-primary mb-2" />
              <p className="text-sm font-medium">Email Us</p>
            </Card>
            <Card className="p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors">
              <Phone className="h-6 w-6 mx-auto text-primary mb-2" />
              <p className="text-sm font-medium">Call Us</p>
            </Card>
            <Card className="p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors">
              <HelpCircle className="h-6 w-6 mx-auto text-primary mb-2" />
              <p className="text-sm font-medium">FAQ</p>
            </Card>
          </div>
        </div>

        {/* FAQs */}
        <div>
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
        <div>
          <h2 className="text-lg font-semibold mb-4">Contact Us</h2>
          <Card className="p-6">
            {submitted && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded">
                Thank you! We've received your message. Our team will contact you soon.
              </div>
            )}
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input
                  type="text"
                  value={contactForm.name}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, name: e.target.value })
                  }
                  placeholder="Your name"
                  required
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, email: e.target.value })
                  }
                  placeholder="your@email.com"
                  required
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <Input
                  type="text"
                  value={contactForm.subject}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, subject: e.target.value })
                  }
                  placeholder="How can we help?"
                  required
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <textarea
                  value={contactForm.message}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, message: e.target.value })
                  }
                  placeholder="Tell us more details..."
                  required
                  rows={4}
                  className="w-full p-3 rounded-lg border bg-input-background resize-none"
                />
              </div>
              <Button type="submit" className="w-full">
                Send Message
              </Button>
            </form>
          </Card>
        </div>

        {/* Contact Info */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Get in Touch</h2>
          <Card className="p-6 space-y-4">
            <div className="flex gap-3">
              <Mail className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Email</p>
                <p className="text-sm text-muted-foreground">support@ecotrack.com</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Phone className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Phone</p>
                <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
              </div>
            </div>
            <div className="flex gap-3">
              <MessageCircle className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Live Chat</p>
                <p className="text-sm text-muted-foreground">
                  Available 9 AM - 9 PM EST, 7 days a week
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
