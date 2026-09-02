import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import { getOnboarding } from "@/store/Slices/OnboardingSlice/OnboardSlice";
import { useTranslation } from "react-i18next";
import DashboardHeading from "@/components/dashboard/DashboardHeading";
import Loader from "@/components/reusable/Loader";
import api from "@/services/api";
import axios from "axios";
import { toast } from "sonner";
import AddPlaceModal from "@/components/modals/AddPlaceModal";
import CardButtons from "@/components/reusable/CardButtons";
import { FaHandshake } from "react-icons/fa";
import { PiHeartbeatLight } from "react-icons/pi";
import { GiHouse } from "react-icons/gi";
import { FaHouseChimneyMedical, FaPlane } from "react-icons/fa6";
import { SearchProvider } from "@/contexts/SearchContext";
import SearchFilter from "@/components/home/SearchFilter";
import SearchResults from "@/components/Search/SearchResults";
import { fetchUser } from "@/store/Slices/Profile/ProfileSlice";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import PrimaryButton from "@/components/reusable/PrimaryButton";
import DiscoverCarsWidget from "@/components/dashboard/DiscoverCarWidget";
// import VacanzaProtectWidget from "@/components/dashboard/VacanzaProtectWidget";
import { FaFerry } from "react-icons/fa6";
import { FaCar } from "react-icons/fa";
import ferry from "@/assets/dashboard/ferry1.jpeg";
import car from "@/assets/dashboard/caar2.png";
import travelhub from "@/assets/dashboard/travel-hub-3.png";

const Dashboard = () => {
  const dispatch = useAppDispatch();
  const { t, i18n } = useTranslation("dashboard");
  const currentLanguage = i18n.language;
  const { loading, error } = useAppSelector((state) => state.onboarding);
  const { data: user } = useAppSelector((state) => state.user);
  const [plans, setPlans] = useState<any[]>([]);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchUser());
  }, [dispatch]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleAddPlace = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  // const storedUser = localStorage.getItem("user");
  // const currentUser = storedUser ? JSON.parse(storedUser) : null;
  // const isUserSubscribed = currentUser?.isSubscribed || false;

  useEffect(() => {
    dispatch(getOnboarding());
  }, [dispatch]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get("/plans");
        setPlans(res.data.data);
      } catch (error) {
        console.error("Error fetching plans:", error);
      }
    };
    fetchPlans();
  }, []);

  const handleCheckout = async (planType: "BASE" | "PREMIUM") => {
    try {
      setCheckoutLoading(true);
      // Find the plan that matches the type
      // We look for plans where the translation name or planType matches our target
      const targetPlan = plans.find((p) => {
        const translation =
          p.translations.find((tr: any) => tr.language === currentLanguage) ||
          p.translations.find((tr: any) => tr.language === "en");
        return translation?.name
          ?.toLowerCase()
          .includes(planType.toLowerCase());
      });

      if (!targetPlan) {
        toast.error(`Could not find ${planType} plan details`);
        return;
      }

      const planTranslation =
        targetPlan.translations.find(
          (tr: any) => tr.language === currentLanguage,
        ) || targetPlan.translations.find((tr: any) => tr.language === "en");
      const planDuration = planTranslation?.planType === "TWO_YEARLY" ? 2 : 1;

      const payload = {
        priceId: targetPlan.priceId,
        planId: targetPlan.id,
        planDuration,
      };

      const res = await api.post("/stripe-payment/checkout", payload);
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Checkout failed");
      } else {
        toast.error("Unexpected error occurred");
      }
    } finally {
      setCheckoutLoading(false);
    }
  };

  const language = i18n.language?.startsWith("el") ? "el" : "en";

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* <h1 className="text-3xl font-bold text-primary-blue mb-6">
        {t("dashboard.title")}
      </h1> */}
      <DashboardHeading />

      {loading && (
        <div>
          <Loader />
        </div>
      )}
      {error && (
        <p className="text-red-500">
          {typeof error === "string" ? error : JSON.stringify(error.message)}
        </p>
      )}

      {/* HomeType Section */}
      <div className="mt-10">
        {/* New HomeType component is under development.  */}
        <CardButtons
          buttons={[
            {
              label: t("dashboard.button1"),
              icon: FaHouseChimneyMedical,
              type: "button",
              onClick: handleAddPlace,
            },
            {
              label: t("dashboard.button2"),
              icon: PiHeartbeatLight,
              type: "link",
              to: "/my-favorite",
            },
            {
              label: t("dashboard.button4"),
              icon: GiHouse,
              // rightIcon: MoveRight,
              type: "link",
              to: "/my-properties",
            },
            {
              label: t("dashboard.button3"),
              icon: FaHandshake,
              type: "link",
              to: "/exchange-request",
            },
          ]}
        />

        {!user?.subscriptions?.some((sub) => sub.status === "ACTIVE") ? (
          <div className="mt-22">
            <p className="text-sm text-dark-3 font-regular text-center">
              {t("dashboard.part0.currentPlan")} :{" "}
              <span className="text-red-500 font-semibold capitalize">
                {t("dashboard.part0.no")}
              </span>
            </p>
            <div className="mt-12 w-[90%] sm:w-[80%] md:w-[50%] lg:w-[40%] mx-auto flex flex-col md:flex-row items-center gap-4 justify-center">
              <Button
                onClick={() => handleCheckout("BASE")}
                disabled={checkoutLoading}
                variant="secondary"
                className="w-full cursor-pointer bg-primary-blue text-white px-6 py-7 hover:bg-[#114480]"
              >
                {checkoutLoading ? "Processing..." : t("dashboard.part0.plan1")}
              </Button>
              <Button
                onClick={() => handleCheckout("PREMIUM")}
                disabled={checkoutLoading}
                variant="secondary"
                className="w-full cursor-pointer bg-[#174075] text-white px-6 py-7 hover:bg-[#114480]"
              >
                {checkoutLoading ? "Processing..." : t("dashboard.part0.plan2")}
              </Button>
            </div>
          </div>
        ) : (
          (() => {
            const activeSub = user?.subscriptions?.find(
              (sub) => sub.status === "ACTIVE",
            );
            const activePlanName =
              activeSub?.plan?.translations?.find((tr) => tr.language === "en")
                ?.name || "";
            const isBase = activePlanName.toLowerCase().includes("base");
            const isPremium = activePlanName.toLowerCase().includes("premium");

            return (
              <div className="mt-10 flex flex-col items-center">
                <p className="text-sm text-dark-3 font-regular text-center">
                  {t("dashboard.part0.currentPlan")} :
                  <span
                    className={`${isBase ? "text-green-500" : isPremium ? "text-[#FFB800]" : "text-red-500"} capitalize ml-1 font-semibold`}
                  >
                    {isBase
                      ? t("dashboard.part0.base")
                      : isPremium
                        ? t("dashboard.part0.premium")
                        : activePlanName}
                  </span>
                </p>

                <div className="mt-6 flex flex-col md:flex-row items-center gap-4">
                  {isBase && (
                    <Button
                      onClick={() =>
                        window.open(
                          "https://buy.stripe.com/28E7sL0L43GK5aT9LWdIA01?prefilled_promo_code=UPREMIUM",
                          "_blank",
                        )
                      }
                      variant="secondary"
                      className="w-full cursor-pointer bg-[#174075] text-white px-8 py-6 hover:bg-[#114480] rounded-full"
                    >
                      {t("dashboard.part0.baseUpgrade")}
                    </Button>
                  )}
                  {isPremium && (
                    <Button
                      variant="secondary"
                      className="w-full cursor-pointer bg-primary-blue text-white px-8 py-6 hover:bg-[#114480] rounded-full"
                      onClick={() =>
                        window.open(
                          "https://www.ferryhopper.com/en/blog/special-offers?aff_uid=vcnzag&utm_source=affiliate-link&utm_medium=in-house&utm_campaign=vcnzag&utm_content=vacanzagreece",
                          "_blank",
                        )
                      }
                    >
                      {t("dashboard.part0.premiumUnlock")}
                    </Button>
                  )}
                </div>
              </div>
            );
          })()
        )}
        {/* header part for all widget  */}
        {/* Travel hub header */}
        <div className="w-full mt-16 md:mt-20">
          {/* bg-gradient-to-br from-primary-blue/[0.06] via-white to-[#eef6ff]  */}
          <div
            className="relative overflow-hidden rounded-[32px] border border-primary-blue/10 px-6 py-12 md:px-12 md:py-16"
            style={{
              backgroundImage: `url(${travelhub})`,
              backgroundRepeat: "no-repeat",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {/* Decorative background */}
            {/* <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary-blue/[0.08] blur-3xl" />
    <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#62c2f9]/[0.10] blur-3xl" /> */}

            {/* Dark subtle overlay for text readability */}
            <div className="absolute inset-0 bg-black/20" />

            {/* Soft white gradient behind content */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-black/20 to-black/35" />

            <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
              {/* Eyebrow */}
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/90 px-4 py-2 shadow-md backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-primary-blue" />

                <span className="text-xs font-semibold tracking-[0.12em] text-primary-blue">
                  {t("dashboard.widgetText.travelHubTitle")}
                </span>
              </div>

              {/* Main heading */}
              <h1 className="font-DM-sans text-3xl max-w-2xl font-bold leading-tight tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)] md:text-5xl">
                {/* Organize your next trip
                <span className="block text-white">in one page!</span> */}
                {t("dashboard.widgetText.travelHubSubtitle")}
              </h1>

              {/* CTA */}
              <div className="mt-8">
                <PrimaryButton
                  title={t("dashboard.seeAllAvailableHouse")}
                  onClick={() => {
                    navigate("/places");
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <SearchProvider>
          <div className="mt-12 md:mt-16 w-full">
            {/* Search section heading */}
            <div className="mb-7 text-center">
              {/* <span className="font-DM-sans text-xs font-semibold uppercase tracking-[0.18em] text-primary-blue/70">
                Find your stay
              </span> */}

              <h2 className="mt-2 font-DM-sans text-2xl font-bold tracking-tight text-primary-blue md:text-3xl">
                {t("dashboard.widgetText.searchTitle")}
              </h2>

              <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500">
                {t("dashboard.widgetText.searchSubtitle")}
              </p>
            </div>

            {/* Search box */}
            <div className="rounded-[28px] border border-primary-blue/10 bg-white p-3 shadow-[0_12px_40px_rgba(23,64,117,0.08)] md:p-5">
              <SearchFilter />
            </div>
          </div>

          <div className="mt-8">
            <SearchResults />
          </div>
        </SearchProvider>

        {/* Travel services */}
        <div className="mt-20 md:mt-24">
          <div className="mb-10 text-center">
            <span className="font-DM-sans text-xs font-semibold tracking-[0.18em] text-primary-blue/70">
              {t("dashboard.widgetText.travelServiceHeading")}
            </span>

            <h2 className="mt-2 font-DM-sans text-2xl font-bold tracking-tight text-primary-blue md:text-3xl">
              {t("dashboard.widgetText.travelServiceTitle")}
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-gray-500 md:text-base">
              {t("dashboard.widgetText.travelServiceSubtitle")}
            </p>
          </div>
        </div>

        {/* Vacanza Protect widget */}
        {/* <VacanzaProtectWidget /> */}

        {/* Ferry widget */}
        <div className="mt-8 overflow-hidden rounded-[28px] border border-primary-blue/10 bg-gradient-to-br from-white via-white to-[#f5f9ff] shadow-[0_16px_50px_rgba(23,64,117,0.08)]">
          {/* Header */}
          <div className="flex flex-col gap-4 border-b border-primary-blue/10 px-6 py-5 sm:flex-row sm:items-center sm:justify-between md:px-8">
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div className="flex h-12 w-12  shrink-0 items-center justify-center rounded-2xl bg-primary-blue/10">
                <FaFerry />
              </div>

              <div>
                <h3 className="font-DM-sans text-lg font-bold text-primary-blue md:text-xl">
                  {t("dashboard.widgetText.ferryTitle")}
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  {t("dashboard.widgetText.ferrySubtitle")}
                </p>
              </div>
            </div>
          </div>

          {/* Widget */}
          <div
            className="flex justify-center px-4 py-7 md:px-8 md:py-9 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${ferry})` }}
          >
            <div className="overflow-hidden rounded-2xl ">
              {language === "en" ? (
                <iframe
                  width="390"
                  height="420"
                  scrolling="no"
                  src="https://www.ferryhopper.com/en/embed/simple?aff_uid=vcnzag&options=nologo"
                  className="block max-w-full"
                  title="Ferryhopper ferry booking"
                />
              ) : (
                <iframe
                  width="390"
                  height="420"
                  scrolling="no"
                  src="https://www.ferryhopper.com/el/embed/simple?aff_uid=vcnzag&options=nologo"
                  className="block max-w-full"
                  title="Ferryhopper ferry booking"
                />
              )}
            </div>
          </div>
        </div>

        {/* car widget */}

        {/* Car rental widget */}
        <div className="mt-8 overflow-hidden rounded-[28px] border border-primary-blue/10 bg-gradient-to-br from-white via-white to-[#f5f9ff] shadow-[0_16px_50px_rgba(23,64,117,0.08)]">
          {/* Header */}
          <div className="flex flex-col gap-4 border-b border-primary-blue/10 px-6 py-3 sm:flex-row sm:items-center sm:justify-between md:px-8">
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-blue/10">
                <FaCar />
              </div>

              {/* Title */}
              <div>
                <h3 className="font-DM-sans text-lg font-bold text-primary-blue md:text-xl">
                  {t("dashboard.widgetText.carTitle")}
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  {t("dashboard.widgetText.carSubtitle")}
                </p>
              </div>
            </div>
          </div>

          {/* Discover Cars */}
          <div
            className="flex min-h-[700px] items-center justify-center px-4 py-7 md:px-8 md:py-9 bg-cover bg-center"
            style={{
              backgroundImage: `url(${car})`,
              backgroundRepeat: "no-repeat",
            }}
          >
            <DiscoverCarsWidget language={language} />
          </div>
        </div>

        {/* flight widget */}

        {/* Flight widget */}
        <div className="mt-8 overflow-hidden rounded-[28px] border border-primary-blue/10 bg-gradient-to-br from-white via-white to-[#f5f9ff] shadow-[0_16px_50px_rgba(23,64,117,0.08)]">
          {/* Header */}
          <div className="flex flex-col gap-4 border-b border-primary-blue/10 px-6 py-5 sm:flex-row sm:items-center sm:justify-between md:px-8">
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-blue/10">
                <FaPlane />
              </div>

              {/* Title */}
              <div>
                <h3 className="font-DM-sans text-lg font-bold text-primary-blue md:text-xl">
                  {t("dashboard.widgetText.flightTitle")}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {t("dashboard.widgetText.flightSubtitle")}
                </p>
              </div>
            </div>
          </div>

          {/* Trip.com Widget */}
          <div className="flex justify-center px-4 py-7 md:px-8 md:py-9 overflow-x-auto">
            <div className="overflow-hidden rounded-2xl bg-white">
              {/* Phone layout */}
              <iframe
                src="https://www.trip.com/partners/ad/S19050852?Allianceid=9679412&SID=326856440&trip_sub1="
                width="320"
                height="480"
                frameBorder="0"
                scrolling="no"
                style={{
                  border: "none",
                  display: "block",
                }}
                id="S19050852-mobile"
                title="Trip.com Flight Booking"
                className="block md:hidden"
              />
              {/* Computer layout */}
              <iframe
                src="https://www.trip.com/partners/ad/S19050852?Allianceid=9679412&SID=326856440&trip_sub1="
                width="900"
                height="230"
                scrolling="no"
                id="S19050852"
                style={{
                  border: "none",
                  display: "block",
                }}
              ></iframe>
            </div>
          </div>
        </div>

        <AddPlaceModal isOpen={isModalOpen} onClose={handleModalClose} />
      </div>
    </div>
  );
};

export default Dashboard;
