import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../theme.dart';

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('About OpenSTR')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          const SizedBox(height: 20),
          const Icon(Icons.waves, size: 64, color: OceanTheme.primary),
          const SizedBox(height: 16),
          const Text(
            'OpenSTR',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: OceanTheme.text,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Short-Term Rental Management',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 14, color: OceanTheme.textSecondary),
          ),
          const SizedBox(height: 8),
          const Text(
            'v1.0.0',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 13, color: OceanTheme.textSecondary),
          ),
          const SizedBox(height: 32),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Open Source',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: OceanTheme.text,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'OpenSTR is open-source software licensed under the GPL-3.0 license.',
                    style: TextStyle(fontSize: 14, color: OceanTheme.textSecondary, height: 1.4),
                  ),
                  const SizedBox(height: 16),
                  OutlinedButton.icon(
                    onPressed: () => _launchUrl('https://github.com/lkilpatrick/OpenSTR'),
                    icon: const Icon(Icons.code, size: 18),
                    label: const Text('View on GitHub'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: OceanTheme.primary,
                      side: const BorderSide(color: OceanTheme.primary),
                    ),
                  ),
                  const SizedBox(height: 8),
                  OutlinedButton.icon(
                    onPressed: () => _launchUrl('https://www.gnu.org/licenses/gpl-3.0.html'),
                    icon: const Icon(Icons.gavel, size: 18),
                    label: const Text('View License'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: OceanTheme.textSecondary,
                      side: const BorderSide(color: OceanTheme.textSecondary),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 32),
          const Text(
            'Powered by OpenSTR',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 12, color: OceanTheme.textSecondary),
          ),
        ],
      ),
    );
  }

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}
