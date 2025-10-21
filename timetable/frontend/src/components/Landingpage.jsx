import React from "react";
import { motion } from "framer-motion";
import {
  ArrowRight, BrainCircuit, Users, School,
  Check, Clock, ShieldCheck, FileInput, Settings2, Rocket,
  GraduationCap, ClipboardEdit, ChevronDown
} from "lucide-react";

// --- Animation Variants ---
const fadeIn = (direction = "up", delay = 0) => ({
  hidden: {
    opacity: 0,
    y: direction === "up" ? 20 : direction === "down" ? -20 : 0,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
      delay: delay,
    },
  },
});

// --- Main Landing Page Component ---
export default function LandingPage() {
  const whoIsItFor = [
    { icon: GraduationCap, title: "University Deans & Registrars", desc: "For managing complex departments, courses, and faculty schedules across campus." },
    { icon: School, title: "School Principals & Admins", desc: "For creating balanced class schedules that meet curriculum and teacher requirements." },
    { icon: Users, title: "Department Heads (HODs)", desc: "For optimizing lab, classroom, and faculty allocation for specific departments." },
    { icon: ClipboardEdit, title: "Coaching & Training Centers", desc: "For handling multiple batches, subjects, and instructor availability with ease." },
  ];

  const testimonials = [
    { name: "Principal, Greenfield Public School", quote: "AcademiaSched has been a revelation. Our timetable process went from a month of manual adjustments to a single afternoon. The AI handles every constraint perfectly." },
    { name: "Dean of Academics, Apex University", quote: "We've eliminated student clashes and optimized classroom usage across 5 departments. The faculty loves the balanced workload distribution." },
    { name: "Director, Vision Coaching Centre", quote: "Managing parallel batches was our biggest challenge. AcademiaSched's platform is intuitive and powerful, allowing us to generate error-free schedules effortlessly." }
  ];

  return (
    <div className="bg-gray-50 text-gray-800 font-sans antialiased">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-lg z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <a href="#" className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
            AcademicSheduler
          </a>
          <a href="/login" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-2 py-2 sm:px-5 sm:py-2.5 rounded-lg text-sm transition-all shadow-sm hover:shadow-md">

            Get Started <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </header>

      <main className="pt-20">
        {/* Hero Section */}
        <section className="pt-20 pb-24 md:pt-28 md:pb-32 text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 z-10">
            <motion.div variants={fadeIn("up", 0.1)} initial="hidden" animate="visible">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tighter">
                Automate Your Academic Timetable in Minutes
              </h1>
              <p className="mt-6 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
                AcademicShedular is the AI-powered platform designed to create balanced, conflict-free timetables for schools and colleges, saving you countless hours of manual work.
              </p>
              <a
                href="/login"
                className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-bold px-6 py-3 sm:px-8 sm:py-4 rounded-full mt-10 text-base sm:text-lg transition-transform transform hover:scale-105"
              >
                Generate a Timetable for Free <ArrowRight className="w-5 h-5" />
              </a>
            </motion.div>
          </div>
        </section>

        {/* What is AcademiaSched? */}
        <section id="about" className="py-16 md:py-24 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tighter">The End of Manual Timetabling</h2>
            <p className="mt-4 text-gray-600 max-w-3xl mx-auto">We empower educational institutions to focus on student success by automating this critical, time-consuming administrative task. Let our AI build a better schedule for you.</p>
            <div className="grid md:grid-cols-3 gap-8 mt-12 text-left">
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <Clock className="w-8 h-8 mb-4 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Save Countless Hours</h3>
                <p className="mt-1 text-gray-600 text-sm">Reduce your scheduling workload from weeks of stressful manual entry to just a few minutes with our powerful AI generator.</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <BrainCircuit className="w-8 h-8 mb-4 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Eliminate All Conflicts</h3>
                <p className="mt-1 text-gray-600 text-sm">Intelligently avoid faculty, classroom, and student batch clashes with our advanced conflict-resolution engine.</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <ShieldCheck className="w-8 h-8 mb-4 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Optimize Resource Use</h3>
                <p className="mt-1 text-gray-600 text-sm">Ensure optimal utilization of all your academic resources, from classrooms and science labs to faculty and equipment.</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tighter">Get Your Perfect Timetable in 3 Simple Steps</h2>
              <p className="mt-4 text-gray-600">Our intuitive process makes sophisticated AI scheduling accessible to every academic institution.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-y-12 md:gap-x-16 mt-16 relative">
              {/* Dashed Line Connector */}
              <div className="hidden md:block absolute top-8 left-0 w-full h-px bg-gray-300 border-t-2 border-dashed -z-10"></div>

              <motion.div variants={fadeIn("up", 0.1)} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center relative">
                <div className="flex items-center justify-center bg-blue-100 text-blue-600 w-16 h-16 rounded-full mx-auto border-4 border-gray-50 shadow-md">
                  <FileInput className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mt-6">1. Input Your Data</h3>
                <p className="mt-2 text-gray-600">Easily upload your courses, faculty lists, student batches, and room availability using our simple interface or templates.</p>
              </motion.div>
              <motion.div variants={fadeIn("up", 0.2)} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center relative">
                <div className="flex items-center justify-center bg-blue-100 text-blue-600 w-16 h-16 rounded-full mx-auto border-4 border-gray-50 shadow-md">
                  <Settings2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mt-6">2. Define Your Rules</h3>
                <p className="mt-2 text-gray-600">Set priorities and custom constraints like teacher preferences, lab requirements, and subject-specific rules.</p>
              </motion.div>
              <motion.div variants={fadeIn("up", 0.3)} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center relative">
                <div className="flex items-center justify-center bg-blue-100 text-blue-600 w-16 h-16 rounded-full mx-auto border-4 border-gray-50 shadow-md">
                  <Rocket className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mt-6">3. Generate Timetable</h3>
                <p className="mt-2 text-gray-600">Click a single button and let our AI engine generate a complete, optimized, and conflict-free timetable in seconds.</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Who is it for Section */}
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tighter">Built for the Needs of Education</h2>
              <p className="mt-4 text-gray-600">From K-12 schools to large universities, AcademicSheduler adapts to your institution's unique scheduling needs.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
              {whoIsItFor.map((item, i) => (
                <motion.div
                  key={item.title}
                  className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all"
                  variants={fadeIn("up", i * 0.1)} initial="hidden" whileInView="visible" viewport={{ once: true }}
                >
                  <item.icon className="w-8 h-8 mb-4 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                  <p className="mt-1 text-gray-600 text-sm">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tighter">Trusted by Academic Administrators</h2>
            </div>
            <div className="grid lg:grid-cols-3 gap-8 mt-16">
              {testimonials.map((testimonial, i) => (
                <motion.div
                  key={i}
                  className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm"
                  variants={fadeIn("up", i * 0.1)} initial="hidden" whileInView="visible" viewport={{ once: true }}
                >
                  <p className="text-gray-600">"{testimonial.quote}"</p>
                  <p className="mt-6 font-semibold text-gray-900">- {testimonial.name}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-16 md:py-24 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tighter">Simple, Transparent Pricing</h2>
              <p className="mt-4 text-gray-600">Choose the plan that's right for your institution. Get started for free.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 mt-16 max-w-4xl mx-auto">
              {/* Free Plan */}
              <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 flex flex-col transform hover:scale-105 hover:shadow-xl transition-all duration-300">
                <h3 className="text-lg font-semibold text-blue-600">Free</h3>
                <p className="text-4xl font-bold text-gray-900 mt-4">$0 <span className="text-lg font-medium text-gray-500">/ forever</span></p>
                <p className="text-gray-600 mt-2">For individuals and small departments.</p>
                <ul className="space-y-3 mt-6 text-gray-600 flex-grow">
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-blue-600" /> Up to 20 Faculty/Rooms</li>
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-blue-600" /> Basic AI Generation</li>
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-blue-600" /> Community Support</li>
                </ul>
                <a href="/login" className="mt-8 block w-full text-center bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 font-semibold px-6 py-3 rounded-lg transition-colors">Get Started</a>
              </div>
              {/* Premium Plan */}
              <div className="bg-gray-900 text-white p-8 rounded-xl border-2 border-blue-600 shadow-2xl relative overflow-hidden flex flex-col transform hover:scale-105 hover:shadow-2xl transition-all duration-300">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 bg-blue-600 text-white text-xs font-bold py-1 px-3 rounded-full uppercase">Full Power</div>
                <h3 className="text-lg font-semibold text-blue-400">Premium</h3>
                <p className="text-4xl font-bold mt-4">100 <span className="text-lg font-medium text-gray-400">/ mo</span></p>
                <p className="text-gray-400 mt-2">For most schools and colleges.</p>
                <ul className="space-y-3 mt-6 text-gray-300 flex-grow">
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-blue-400" /> Unlimited Faculty & Rooms</li>
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-blue-400" /> Advanced AI Generation</li>
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-blue-400" /> Priority Email Support</li>
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-blue-400" /> PDF & CSV Export Options</li>
                </ul>
                <a href="/login" className="mt-8 block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors">Choose Premium</a>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tighter">Frequently Asked Questions</h2>
              <p className="mt-4 text-gray-600">Have questions? We've got answers. If you have any other questions, feel free to reach out.</p>
            </div>
            <div className="mt-12 space-y-4">
              <details className="p-6 bg-white rounded-lg border border-gray-200 group cursor-pointer">
                <summary className="flex items-center justify-between font-semibold text-gray-900">
                  What kind of institutions can use AcademicSheduler?
                  <ChevronDown className="w-5 h-5 transition-transform duration-300 group-open:rotate-180" />
                </summary>
                <p className="mt-4 text-gray-600">
                  AcademicSheduler is designed for a wide range of educational institutions, including K-12 schools, colleges, universities, and private coaching centers. Our flexible rules engine can adapt to various scheduling complexities.
                </p>
              </details>
              <details className="p-6 bg-white rounded-lg border border-gray-200 group cursor-pointer">
                <summary className="flex items-center justify-between font-semibold text-gray-900">
                  Is the Free plan really free forever?
                  <ChevronDown className="w-5 h-5 transition-transform duration-300 group-open:rotate-180" />
                </summary>
                <p className="mt-4 text-gray-600">
                  Yes, absolutely. The Free plan is designed for small departments or individual use and will remain free forever. It includes all the basic features you need to generate a complete timetable.
                </p>
              </details>
              <details className="p-6 bg-white rounded-lg border border-gray-200 group cursor-pointer">
                <summary className="flex items-center justify-between font-semibold text-gray-900">
                  Can I make manual adjustments after the timetable is generated?
                  <ChevronDown className="w-5 h-5 transition-transform duration-300 group-open:rotate-180" />
                </summary>
                <p className="mt-4 text-gray-600">
                  Yes. While our AI aims to create the optimal schedule, we understand the need for flexibility. Our user-friendly editor allows you to easily drag-and-drop or make manual tweaks to the generated timetable before finalizing it.
                </p>
              </details>
              <details className="p-6 bg-white rounded-lg border border-gray-200 group cursor-pointer">
                <summary className="flex items-center justify-between font-semibold text-gray-900">
                  How secure is my institution's data?
                  <ChevronDown className="w-5 h-5 transition-transform duration-300 group-open:rotate-180" />
                </summary>
                <p className="mt-4 text-gray-600">
                  We take data security very seriously. All data is encrypted in transit and at rest. We adhere to strict privacy policies to ensure your institution's information is always kept confidential and secure.
                </p>
              </details>
            </div>
          </div>
        </section>

        {/* Contact Us Section */}
        <section id="contact" className="py-16 md:py-24 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tighter">Get in Touch</h2>
              <p className="mt-4 text-gray-600">We’d love to hear from you. Whether you have a question about features, pricing, or anything else, our team is ready to answer all your questions.</p>
            </div>
            <div className="mt-12">
              <form action="#" method="POST" className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
                <div>
                  <label htmlFor="first-name" className="block text-sm font-medium text-gray-700">First name</label>
                  <div className="mt-1">
                    <input type="text" name="first-name" id="first-name" autoComplete="given-name" className="py-3 px-4 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md" />
                  </div>
                </div>
                <div>
                  <label htmlFor="last-name" className="block text-sm font-medium text-gray-700">Last name</label>
                  <div className="mt-1">
                    <input type="text" name="last-name" id="last-name" autoComplete="family-name" className="py-3 px-4 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md" />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                  <div className="mt-1">
                    <input id="email" name="email" type="email" autoComplete="email" className="py-3 px-4 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md" />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
                  <div className="mt-1">
                    <textarea id="message" name="message" rows={4} className="py-3 px-4 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 border border-gray-300 rounded-md"></textarea>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <button type="submit" className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Send Message
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <div className="bg-blue-600 rounded-xl p-8 sm:p-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tighter">Ready to build a smarter timetable?</h2>
              <p className="mt-4 text-blue-200 max-w-2xl mx-auto">Say goodbye to scheduling headaches and manual errors. Let AcademicSheduler create your perfect academic timetable in seconds. Get started for free—no credit card required.</p>
              <a
                href="/login"
                className="inline-flex items-center gap-2 bg-white hover:bg-gray-200 text-blue-700 font-bold px-8 py-4 rounded-full mt-8 text-lg transition-transform transform hover:scale-105"
              >
                Create Your Free Timetable Now
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 text-center">
          <div className="flex flex-col md:flex-row justify-between items-center md:text-left">
            <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} AcademiaSched. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#about" className="text-sm text-gray-600 hover:text-blue-600">About</a>
              <a href="#pricing" className="text-sm text-gray-600 hover:text-blue-600">Pricing</a>
              <a href="#faq" className="text-sm text-gray-600 hover:text-blue-600">FAQ</a>
              <a href="#contact" className="text-sm text-gray-600 hover:text-blue-600">Contact</a>
            </div>
          </div>
          <div className="mt-6">
            <p className="text-sm text-gray-500">Developed by Aarkesh & Agalya</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

