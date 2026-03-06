import Link from "next/link";
import {
  Github,
  Linkedin,
  Mail,
  Twitter,
  Youtube,
  Zap,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const productLinks: { label: string; href: string }[] = [];

const companyLinks: { label: string; href: string }[] = [];

const resourceLinks: { label: string; href: string }[] = [];

const legalLinks: { label: string; href: string }[] = [];

const socialLinks = [
  { icon: Twitter, href: "https://twitter.com/forexbacktest", label: "Twitter" },
  { icon: Linkedin, href: "https://linkedin.com/company/forexbacktest", label: "LinkedIn" },
  { icon: Github, href: "https://github.com/forexbacktest", label: "GitHub" },
  { icon: Youtube, href: "https://youtube.com/forexbacktest", label: "YouTube" },
];

export function Footer() {
  return (
    <footer className="w-full bg-background border-t">
      <div className="container px-4 py-16 mx-auto">
        {/* Top Section - CTA */}
        <div className="mb-16 p-8 rounded-2xl bg-primary/5 border border-primary/10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold mb-2">
                Ready to start backtesting your forex strategies?
              </h3>
              <p className="text-muted-foreground">
                Join traders using ForexBacktest to optimize your trading strategies.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 md:justify-end">
              <Link href="/sign-up">
                <Button size="lg" className="gap-2">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Footer Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span>ForexBacktest</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              Professional forex backtesting platform to test and optimize your trading strategies.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span>support@forexbacktest.com</span>
              </div>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-4">
            <h3 className="font-semibold">Product</h3>
            <ul className="space-y-2">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div className="space-y-4">
            <h3 className="font-semibold">Company</h3>
            <ul className="space-y-2">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div className="space-y-4">
            <h3 className="font-semibold">Resources</h3>
            <ul className="space-y-2">
              {resourceLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter Column */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <h3 className="font-semibold">Stay Updated</h3>
            <p className="text-sm text-muted-foreground">
              Get the latest news and updates delivered to your inbox.
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter your email"
                className="max-w-[180px]"
              />
              <Button size="sm">Subscribe</Button>
            </div>
            
            {/* Social Links */}
            <div className="pt-2">
              <p className="text-sm font-medium mb-3">Follow us</p>
              <div className="flex gap-3">
                {socialLinks.map((social) => (
                  <Link
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                    aria-label={social.label}
                  >
                    <social.icon className="h-4 w-4" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} ForexBacktest, Inc. All rights reserved.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                All systems operational
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
