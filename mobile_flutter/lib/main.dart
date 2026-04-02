import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'theme.dart';
import 'services/auth_service.dart';
import 'services/network_service.dart';
import 'screens/auth/login_screen.dart';
import 'screens/schedule/schedule_screen.dart';

import 'screens/profile/profile_screen.dart';
import 'screens/history/past_cleans_screen.dart';
import 'screens/session/active_session_screen.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthService()),
        ChangeNotifierProvider(create: (_) => NetworkService()),
      ],
      child: const OpenSTRApp(),
    ),
  );
}

class OpenSTRApp extends StatelessWidget {
  const OpenSTRApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'OpenSTR',
      debugShowCheckedModeBanner: false,
      theme: OceanTheme.themeData,
      home: const AuthGate(),
      onGenerateRoute: (settings) {
        if (settings.name == '/session') {
          final sessionId = settings.arguments as String;
          return MaterialPageRoute(
            builder: (_) => ActiveSessionScreen(sessionId: sessionId),
          );
        }
        return null;
      },
    );
  }
}

class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthService>();

    if (auth.loading) {
      return Scaffold(
        backgroundColor: OceanTheme.primary,
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'OpenSTR',
                style: TextStyle(
                  fontSize: 36,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Cleaner App',
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.white.withValues(alpha: 0.8),
                ),
              ),
              const SizedBox(height: 32),
              const CircularProgressIndicator(color: Colors.white),
            ],
          ),
        ),
      );
    }

    if (!auth.isAuthenticated) {
      return const LoginScreen();
    }

    return const MainShell();
  }
}

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _currentIndex = 0;

  static const _titles = ['Schedule', 'History', 'Profile'];

  final _screens = const [
    ScheduleScreen(),
    PastCleansScreen(),
    ProfileScreen(),
  ];

  @override
  void initState() {
    super.initState();
    // Check network on app start
    NetworkService().checkNetwork();
  }

  @override
  Widget build(BuildContext context) {
    final network = context.watch<NetworkService>();

    return Scaffold(
      appBar: AppBar(
        title: Text(_titles[_currentIndex]),
        actions: [
          if (!network.isLocal)
            Tooltip(
              message: 'Remote — connect to property WiFi to clean',
              child: Container(
                margin: const EdgeInsets.only(right: 12),
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.cloud_outlined, size: 14),
                    SizedBox(width: 4),
                    Text(
                      'Remote',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
      body: IndexedStack(index: _currentIndex, children: _screens),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (i) {
          setState(() => _currentIndex = i);
          // Re-check network when switching tabs
          NetworkService().checkNetwork();
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.calendar_today),
            label: 'Schedule',
          ),
          NavigationDestination(icon: Icon(Icons.history), label: 'History'),
          NavigationDestination(icon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }
}
