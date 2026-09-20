import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";

import { gsap } from "../../services/gsap";
import "./Donate.css";
import { BACKEND_URL } from "../../config/api";

const donationAmounts = [500, 1000, 2500, 5000];

const API_URL = `${BACKEND_URL}/api/donations`;

function Donate() {
  const sectionRef = useRef(null);

  const [selectedAmount, setSelectedAmount] = useState(1000);
  const [customAmount, setCustomAmount] = useState("");

  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorPhone, setDonorPhone] = useState("");

  const [isAnonymous, setIsAnonymous] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [paymentError, setPaymentError] = useState("");

  useGSAP(
    () => {
      const section = sectionRef.current;

      if (!section) return;

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (prefersReducedMotion) {
        gsap.set(
          [
            ".donate-eyebrow",
            ".donate-title",
            ".donate-description",
            ".donate-card",
            ".donate-note",
          ],
          {
            opacity: 1,
            y: 0,
          }
        );

        return;
      }

      const isAlreadyVisible =
        section.getBoundingClientRect().top <
        window.innerHeight * 0.9;

      if (isAlreadyVisible) {
        gsap.set(
          [
            ".donate-eyebrow",
            ".donate-title",
            ".donate-description",
            ".donate-card",
            ".donate-note",
          ],
          {
            opacity: 1,
            y: 0,
          }
        );

        return;
      }

      gsap
        .timeline({
          scrollTrigger: {
            trigger: section,
            start: "top 78%",
            once: true,
          },
        })
        .from(".donate-eyebrow", {
          y: 20,
          opacity: 0,
          duration: 0.6,
          ease: "power3.out",
        })
        .from(
          ".donate-title",
          {
            y: 45,
            opacity: 0,
            duration: 0.9,
            ease: "power3.out",
          },
          "-=0.25"
        )
        .from(
          ".donate-description",
          {
            y: 25,
            opacity: 0,
            duration: 0.7,
            ease: "power3.out",
          },
          "-=0.45"
        )
        .from(
          ".donate-card",
          {
            y: 45,
            opacity: 0,
            duration: 0.9,
            ease: "power3.out",
          },
          "-=0.35"
        )
        .from(
          ".donate-note",
          {
            y: 15,
            opacity: 0,
            duration: 0.5,
            ease: "power3.out",
          },
          "-=0.35"
        );
    },
    {
      scope: sectionRef,
    }
  );

  const handlePresetAmount = (amount) => {
    setSelectedAmount(amount);
    setCustomAmount("");
    setPaymentError("");
    setPaymentMessage("");
  };

  const handleCustomAmount = (event) => {
    const value = event.target.value.replace(/\D/g, "");

    setCustomAmount(value);

    if (value) {
      setSelectedAmount(null);
    }

    setPaymentError("");
    setPaymentMessage("");
  };

  const handleAnonymousChange = (event) => {
    const anonymous = event.target.checked;

    setIsAnonymous(anonymous);

    setPaymentError("");
    setPaymentMessage("");

    if (anonymous) {
      setDonorName("");
      setDonorEmail("");
      setDonorPhone("");
    }
  };

  const finalAmount = customAmount
    ? Number(customAmount)
    : selectedAmount;

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const existingScript = document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      );

      if (existingScript) {
        existingScript.addEventListener("load", () =>
          resolve(true)
        );

        existingScript.addEventListener("error", () =>
          resolve(false)
        );

        return;
      }

      const script = document.createElement("script");

      script.src =
        "https://checkout.razorpay.com/v1/checkout.js";

      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);

      document.body.appendChild(script);
    });
  };

  const handleDonation = async () => {
    setPaymentError("");
    setPaymentMessage("");

    if (!finalAmount || finalAmount < 1) {
      setPaymentError(
        "Please enter a valid donation amount."
      );
      return;
    }

    if (!isAnonymous) {
      if (!donorName.trim()) {
        setPaymentError("Please enter your name.");
        return;
      }

      if (!donorEmail.trim()) {
        setPaymentError("Please enter your email.");
        return;
      }

      if (!donorPhone.trim()) {
        setPaymentError(
          "Please enter your phone number."
        );
        return;
      }
    }

    setIsProcessing(true);

    try {
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        throw new Error(
          "Razorpay Checkout could not be loaded."
        );
      }

      const orderResponse = await fetch(
        `${API_URL}/create-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: finalAmount,
            currency: "INR",

            donor_name: isAnonymous
              ? null
              : donorName.trim(),

            donor_email: isAnonymous
              ? null
              : donorEmail.trim(),

            donor_phone: isAnonymous
              ? null
              : donorPhone.trim(),

            is_anonymous: isAnonymous,
          }),
        }
      );

      const orderData = await orderResponse.json();

      if (!orderResponse.ok || !orderData.success) {
        throw new Error(
          orderData.message ||
            "Unable to create Razorpay order."
        );
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,

        name: "Rudraksh Social & Cultural Organization",

        description: isAnonymous
          ? "Anonymous donation to Rudraksh"
          : "Donation to Rudraksh",

        order_id: orderData.order.id,

        prefill: isAnonymous
          ? {}
          : {
              name: donorName.trim(),
              email: donorEmail.trim(),
              contact: donorPhone.trim(),
            },

        theme: {
          color: "#e87917",
        },

        handler: async function (response) {
          try {
            setPaymentMessage(
              "Verifying your payment..."
            );

            const verifyResponse = await fetch(
              `${API_URL}/verify-payment`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  donationId: orderData.donationId,

                  razorpay_order_id:
                    response.razorpay_order_id,

                  razorpay_payment_id:
                    response.razorpay_payment_id,

                  razorpay_signature:
                    response.razorpay_signature,
                }),
              }
            );

            const verifyData =
              await verifyResponse.json();

            if (
              !verifyResponse.ok ||
              !verifyData.success
            ) {
              throw new Error(
                verifyData.message ||
                  "Payment verification failed."
              );
            }

            setPaymentMessage(
              isAnonymous
                ? "Anonymous donation successful! Thank you for supporting Rudraksh ❤️"
                : "Donation successful! Thank you for supporting Rudraksh ❤️"
            );

            setCustomAmount("");
            setSelectedAmount(1000);

            setDonorName("");
            setDonorEmail("");
            setDonorPhone("");

            setIsAnonymous(false);
          } catch (error) {
            console.error(
              "PAYMENT VERIFICATION ERROR:",
              error
            );

            setPaymentError(
              error.message ||
                "Payment verification failed."
            );
          }
        },

        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            setPaymentMessage("");
          },
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on(
        "payment.failed",
        function (response) {
          console.error(
            "RAZORPAY PAYMENT FAILED:",
            response
          );

          setPaymentError(
            response?.error?.description ||
              "Payment failed. Please try again."
          );

          setIsProcessing(false);
        }
      );

      razorpay.open();

      setIsProcessing(false);
    } catch (error) {
      console.error(
        "DONATION ERROR:",
        error
      );

      setPaymentError(
        error.message ||
          "Something went wrong while starting the payment."
      );

      setIsProcessing(false);
    }
  };

  return (
    <section
      ref={sectionRef}
      id="donate"
      className="donate-section"
    >
      <div className="donate-orb donate-orb-one" />
      <div className="donate-orb donate-orb-two" />

      <div className="donate-container">
        <div className="donate-content">
          <div className="donate-eyebrow">
            <span />
            SUPPORT OUR WORK
          </div>

          <h2 className="donate-title">
            Your support
            <br />
            <em>creates impact.</em>
          </h2>

          <p className="donate-description">
            Every contribution helps us continue our social,
            educational and cultural initiatives and reach
            more people in our communities.
          </p>

          <div className="donate-impact-list">
            <div className="donate-impact-item">
              <span>01</span>
              <p>Support community initiatives</p>
            </div>

            <div className="donate-impact-item">
              <span>02</span>
              <p>Help educational programs</p>
            </div>

            <div className="donate-impact-item">
              <span>03</span>
              <p>Strengthen cultural activities</p>
            </div>
          </div>
        </div>

        <div className="donate-card">
          <div className="donate-card-top">
            <span>MAKE A DONATION</span>

            <div className="donate-heart">♥</div>
          </div>

          <div className="donate-amount-display">
            <span>₹</span>

            <strong>
              {finalAmount
                ? finalAmount.toLocaleString("en-IN")
                : "0"}
            </strong>
          </div>

          <p className="donate-select-label">
            SELECT AN AMOUNT
          </p>

          <div className="donate-presets">
            {donationAmounts.map((amount) => (
              <button
                key={amount}
                type="button"
                className={
                  selectedAmount === amount &&
                  !customAmount
                    ? "active"
                    : ""
                }
                onClick={() =>
                  handlePresetAmount(amount)
                }
              >
                ₹{amount.toLocaleString("en-IN")}
              </button>
            ))}
          </div>

          <div className="donate-custom">
            <span>₹</span>

            <input
              type="text"
              inputMode="numeric"
              placeholder="Enter custom amount"
              value={customAmount}
              onChange={handleCustomAmount}
            />
          </div>

          <label className="donate-anonymous">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={handleAnonymousChange}
            />

            <span>
              Donate anonymously
            </span>
          </label>

          {!isAnonymous && (
            <>
              <input
                type="text"
                className="donate-donor-input"
                placeholder="Your name"
                value={donorName}
                onChange={(event) =>
                  setDonorName(event.target.value)
                }
              />

              <input
                type="email"
                className="donate-donor-input"
                placeholder="Your email"
                value={donorEmail}
                onChange={(event) =>
                  setDonorEmail(event.target.value)
                }
              />

              <input
                type="tel"
                className="donate-donor-input"
                placeholder="Your phone number"
                value={donorPhone}
                onChange={(event) =>
                  setDonorPhone(event.target.value)
                }
              />
            </>
          )}

          <button
            type="button"
            className="donate-button"
            disabled={
              !finalAmount ||
              finalAmount < 1 ||
              isProcessing
            }
            onClick={handleDonation}
          >
            <span>
              {isProcessing
                ? "Processing..."
                : "Donate with Razorpay"}
            </span>

            <strong>↗</strong>
          </button>

          {paymentMessage && (
            <p className="donate-payment-success">
              {paymentMessage}
            </p>
          )}

          {paymentError && (
            <p className="donate-payment-error">
              {paymentError}
            </p>
          )}

          <div className="donate-secure">
            <span>●</span>
            Secure payment powered by Razorpay
          </div>
        </div>
      </div>

      <div className="donate-note">
        <span>RUDRAKSH</span>
        <span>EVERY CONTRIBUTION MATTERS</span>
      </div>
    </section>
  );
}

export default Donate;