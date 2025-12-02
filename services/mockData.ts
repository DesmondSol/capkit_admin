import { UserProfile, StartupData, UserRole, Investor } from "../types";

export const MOCK_USERS: UserProfile[] = [
    {
        id: 'u1',
        email: 'admin@capkit.com',
        displayName: 'CapKit Admin',
        role: UserRole.ADMIN,
        isActive: true,
        createdAt: new Date(),
        lastLogin: new Date()
    },
    {
        id: 'u2',
        email: 'founder@techflow.com',
        displayName: 'Sarah Chen',
        role: UserRole.STARTUP,
        isActive: true,
        createdAt: new Date(),
        lastLogin: new Date()
    },
    {
        id: 'u3',
        email: 'investor@vc.com',
        displayName: 'Marcus Sterling',
        role: UserRole.INVESTOR,
        isActive: false,
        createdAt: new Date(),
        lastLogin: new Date()
    }
];

export const MOCK_STARTUPS: StartupData[] = [
    {
        id: 's1',
        name: 'EcoSense',
        shortDescription: 'AI-driven agriculture monitoring for sustainable farming.',
        fullDescription: 'EcoSense uses IoT sensors and satellite imagery combined with proprietary AI models to predict crop disease vectors 3 weeks in advance. We help farmers reduce pesticide usage by 40% while increasing yield.',
        founderName: 'Dr. Emily Carter',
        founderBio: 'PhD in Agronomy from Cornell, 10 years research experience.',
        stage: 'Seed',
        sector: 'AgTech',
        readinessScore: 85,
        isFavorite: true,
        businessModel: 'SaaS subscription ($50/acre/year) + Hardware sales',
        traction: '$120k ARR, 5 pilot farms live.',
        askAmount: 1500000,
        aiEvaluation: undefined // Simulating needs eval
    },
    {
        id: 's2',
        name: 'PayLoop',
        shortDescription: 'Seamless cross-border payments for freelancers.',
        fullDescription: 'PayLoop is a fintech solution reducing transaction fees for African freelancers working for US/EU companies. We use crypto-rails for settlement but provide fiat-in/fiat-out for end users.',
        founderName: 'David Osei',
        founderBio: 'Ex-Stripe engineer, YC Alum.',
        stage: 'Series A',
        sector: 'Fintech',
        readinessScore: 92,
        isFavorite: false,
        businessModel: '0.5% transaction fee',
        traction: '$2.1M monthly volume, 15k active users.',
        askAmount: 5000000,
        aiEvaluation: undefined
    },
    {
        id: 's3',
        name: 'VibeCheck',
        shortDescription: 'Social media mood analysis for brands.',
        fullDescription: 'We scrape TikTok and Instagram to tell brands how cool they are.',
        founderName: 'Jake Paulson',
        founderBio: 'College dropout, influencer with 10k followers.',
        stage: 'Idea',
        sector: 'Consumer Social',
        readinessScore: 40,
        isFavorite: false,
        businessModel: 'Ad supported app',
        traction: 'None yet',
        askAmount: 500000,
        aiEvaluation: undefined
    }
];

export const MOCK_INVESTORS: Investor[] = [
    {
        id: 'i1',
        fullName: 'Marcus Sterling',
        email: 'marcus@sterlingvc.com',
        firmName: 'Sterling Ventures',
        investorType: 'VC',
        investmentFocus: 'Fintech, SaaS',
        checkSize: '$500k - $2M',
        status: 'approved',
        linkedinProfile: 'https://linkedin.com'
    },
    {
        id: 'i2',
        fullName: 'Elena Ross',
        email: 'elena.ross@angel.co',
        firmName: 'Angel Syndicate',
        investorType: 'Angel',
        investmentFocus: 'AgTech, Impact',
        checkSize: '$25k - $100k',
        status: 'pending'
    },
    {
        id: 'i3',
        fullName: 'Global Capital Partners',
        email: 'contact@gcp.com',
        firmName: 'Global Capital',
        investorType: 'PE',
        investmentFocus: 'Growth Stage',
        checkSize: '$5M+',
        status: 'rejected'
    }
];

export const generateSampleLogs = () => [
    "User u2 updated pitch deck",
    "User u1 disabled access for u3",
    "New startup registration: VibeCheck",
    "Investor viewed EcoSense profile",
    "System backup completed",
    "User u2 logged in",
    "Interaction: Startup evaluation generated for PayLoop"
];