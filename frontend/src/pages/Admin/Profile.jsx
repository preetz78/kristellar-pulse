import { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Edit2,
  Activity,
  Camera,
  ShieldCheck,
} from "lucide-react";

const activityFeed = [
  {
    text: "Updated project 'AI Dashboard'",
    time: "2 hours ago",
    tone: "from-sky-500 to-blue-600",
  },
  {
    text: "Completed task 'UI Revamp'",
    time: "5 hours ago",
    tone: "from-indigo-500 to-blue-700",
  },
  {
    text: "Joined organization 'TechFlow'",
    time: "Yesterday",
    tone: "from-cyan-500 to-sky-600",
  },
];

const profileStats = [
  { label: "Projects Led", value: "12" },
  { label: "Tasks Closed", value: "148" },
  { label: "Team Rating", value: "4.9/5" },
];

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);

  const [user, setUser] = useState({
    name: "Asher Rhodes",
    email: "asher.rhodes@company.com",
    role: "Administrator",
    phone: "+91 98765 43210",
    joinDate: "March 15, 2024",
    location: "Kolkata, West Bengal",
    image: "https://i.pravatar.cc/300?img=12",
    bio: "Passionate about building intuitive digital experiences, mentoring strong teams, and turning fast-moving ideas into polished products people actually enjoy using.",
    department: "Engineering",
  });

  const handleChange = (field, value) => {
    setUser({ ...user, [field]: value });
  };

  const toggleEditing = () => {
    setIsEditing((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_28%),linear-gradient(180deg,_#f7fbff_0%,_#eef5ff_45%,_#f8fbff_100%)] p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex justify-end">
          <button
            onClick={toggleEditing}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/25"
          >
            <Edit2 size={16} />
            {isEditing ? "Save Changes" : "Edit Profile"}
          </button>
        </div>

        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[0_24px_60px_-28px_rgba(15,23,42,0.28)]">
          <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-r from-[#0f172a] via-[#132c56] to-[#2563eb] px-6 py-8 text-white lg:px-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.22),_transparent_24%),radial-gradient(circle_at_bottom_left,_rgba(96,165,250,0.22),_transparent_28%)]" />
            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-6 md:flex-row md:items-center">
                <div className="relative w-fit">
                  <div className="rounded-[1.75rem] bg-white/10 p-1.5 shadow-2xl ring-1 ring-white/20 backdrop-blur">
                    <img
                      src={user.image}
                      alt="profile"
                      className="h-28 w-28 rounded-[1.35rem] object-cover"
                    />
                  </div>
                  <button className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-slate-950/55 text-white backdrop-blur transition hover:bg-slate-950/70">
                    <Camera size={16} />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    {isEditing ? (
                      <input
                        value={user.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        className="min-w-[240px] rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-3xl font-semibold tracking-tight text-white outline-none placeholder:text-white/60 focus:border-white/40 focus:bg-white/15"
                      />
                    ) : (
                      <h2 className="text-3xl font-semibold tracking-tight">
                        {user.name}
                      </h2>
                    )}

                    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-blue-50 backdrop-blur">
                      <ShieldCheck size={14} />
                      {user.role}
                    </span>
                  </div>

                  <p className="max-w-2xl text-sm leading-6 text-blue-100/90">
                    {user.email}
                  </p>

                  <div className="flex flex-wrap gap-3">
                    <InlineMeta icon={<Briefcase size={14} />} text={user.department} />
                    <InlineMeta icon={<MapPin size={14} />} text={user.location} />
                    <InlineMeta icon={<Calendar size={14} />} text={`Joined ${user.joinDate}`} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {profileStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur"
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-blue-100/75">
                      {stat.label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-white">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6 p-6 lg:p-8">
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <InfoCard
                title="Contact Information"
                // subtitle="Core details used across workspace communication and organization records."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <Field
                    icon={<Mail size={18} />}
                    label="Email"
                    value={user.email}
                    isEditing={false}
                  />
                  <Field
                    icon={<Phone size={18} />}
                    label="Phone"
                    value={user.phone}
                    isEditing={isEditing}
                    onChange={(value) => handleChange("phone", value)}
                  />
                  <Field
                    icon={<MapPin size={18} />}
                    label="Location"
                    value={user.location}
                    isEditing={isEditing}
                    onChange={(value) => handleChange("location", value)}
                  />
                  <Field
                    icon={<Briefcase size={18} />}
                    label="Department"
                    value={user.department}
                    isEditing={isEditing}
                    onChange={(value) => handleChange("department", value)}
                  />
                </div>
              </InfoCard>
              <InfoCard
                title="Recent Activity"
                // subtitle="Latest actions across your projects and team spaces."
                icon={<Activity size={16} />}
              >
                <div className="space-y-3">
                  {activityFeed.map((item) => (
                    <ActivityItem
                      key={`${item.text}-${item.time}`}
                      text={item.text}
                      time={item.time}
                      tone={item.tone}
                    />
                  ))}
                </div>
              </InfoCard>
            </div>

            <InfoCard
              title="About"
            //   subtitle="A short professional introduction visible in your internal workspace profile."
            >
              {isEditing ? (
                <textarea
                  value={user.bio}
                  onChange={(e) => handleChange("bio", e.target.value)}
                  className="min-h-[150px] w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              ) : (
                <p className="w-full text-sm leading-7 text-slate-600">{user.bio}</p>
              )}
            </InfoCard>
          </div>
        </section>
      </div>
    </div>
  );
};

const InlineMeta = ({ icon, text }) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-blue-50/95 backdrop-blur">
    {icon}
    {text}
  </span>
);

const InfoCard = ({ title, subtitle, children, icon }) => (
  <div className="rounded-[1.75rem] border border-slate-200/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.98)_0%,_rgba(248,250,252,0.98)_100%)] p-5 shadow-[0_16px_40px_-30px_rgba(15,23,42,0.4)] lg:p-6">
    <div className="mb-5 flex items-start justify-between gap-3">
      <div>
        <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          {icon ? (
            <span className="rounded-xl bg-blue-100 p-2 text-blue-700">{icon}</span>
          ) : null}
          {title}
        </h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>
      </div>
    </div>
    {children}
  </div>
);

const Field = ({ icon, label, value, isEditing, onChange }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md">
    <div className="flex items-start gap-3">
      <div className="rounded-2xl bg-slate-100 p-3 text-slate-600">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          {label}
        </p>
        {isEditing ? (
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="mt-2 w-full border-b border-slate-200 bg-transparent pb-1 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500"
          />
        ) : (
          <p className="mt-2 break-words text-sm font-medium text-slate-800">{value}</p>
        )}
      </div>
    </div>
  </div>
);

const ActivityItem = ({ text, time, tone }) => (
  <div className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
    <div className="flex min-w-0 items-center gap-3">
      <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${tone} flex-shrink-0`} />
      <p className="truncate text-sm font-medium text-slate-700">{text}</p>
    </div>
    <span className="whitespace-nowrap text-xs font-medium text-slate-400 transition group-hover:text-blue-600">
      {time}
    </span>
  </div>
);

export default Profile;
