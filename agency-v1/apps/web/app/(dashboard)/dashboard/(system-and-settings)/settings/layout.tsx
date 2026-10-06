import { SettingsSidebar } from "@/components/settings/settings-sidebar";
import { SettingsDynamicContainer } from "@/components/settings/settings-dynamic-container";
import { TrackPageEvent } from "@/modules/analytics/components/track-page-event";

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="ds-page">
            <TrackPageEvent eventName="ViewSettings" isCustom={true} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
                    <SettingsSidebar />

                    <main className="flex-1 min-w-0 w-full pb-20 lg:pb-0">
                        <SettingsDynamicContainer>
                            {children}
                        </SettingsDynamicContainer>
                    </main>
                </div>
            </div>
        </div>
    );
}
