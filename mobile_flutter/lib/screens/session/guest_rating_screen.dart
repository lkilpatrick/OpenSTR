import 'package:flutter/material.dart';
import '../../theme.dart';
import '../../services/api_service.dart';

const _ratingLabels = [
  '',
  'Never have them back',
  'Below average',
  'Average',
  'Good guests',
  'Invite back any time',
];

class GuestRatingScreen extends StatefulWidget {
  final String sessionId;
  final VoidCallback onDone;

  const GuestRatingScreen({
    super.key,
    required this.sessionId,
    required this.onDone,
  });

  @override
  State<GuestRatingScreen> createState() => _GuestRatingScreenState();
}

class _GuestRatingScreenState extends State<GuestRatingScreen> {
  final _api = ApiService();
  int _rating = 0;
  final _notesController = TextEditingController();
  bool _loading = false;

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (_rating == 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a guest satisfaction rating')),
      );
      return;
    }

    setState(() => _loading = true);
    try {
      await _api.dio.post('/sessions/${widget.sessionId}/rating', data: {
        'rating': _rating,
        'review_text': _notesController.text,
      });

      if (!mounted) return;
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          title: const Row(
            children: [
              Icon(Icons.check_circle, color: OceanTheme.success),
              SizedBox(width: 8),
              Text('Clean Submitted!'),
            ],
          ),
          content: const Text('Great work! Your session has been submitted for review.'),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(ctx).pop();
                widget.onDone();
              },
              child: const Text('Done'),
            ),
          ],
        ),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not submit rating')),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final ratingColor = _rating == 0
        ? OceanTheme.textSecondary
        : OceanTheme.ratingColor(_rating);

    return Scaffold(
      appBar: AppBar(title: const Text('Guest Satisfaction')),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 440),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.star_outline, size: 48, color: OceanTheme.primary),
                const SizedBox(height: 12),
                const Text(
                  'How did these guests do?',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: OceanTheme.text),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 4),
                const Text(
                  'Rate the condition the guests left the property in.',
                  style: TextStyle(fontSize: 14, color: OceanTheme.textSecondary),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 28),

                // Stars
                Container(
                  padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(5, (i) {
                          final star = i + 1;
                          final isSelected = _rating >= star;
                          return GestureDetector(
                            onTap: () => setState(() => _rating = star),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 6),
                              child: Icon(
                                isSelected ? Icons.star : Icons.star_border,
                                size: 48,
                                color: isSelected ? ratingColor : const Color(0xFFD1D5DB),
                              ),
                            ),
                          );
                        }),
                      ),
                      if (_rating > 0) ...[
                        const SizedBox(height: 10),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                          decoration: BoxDecoration(
                            color: ratingColor.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            _ratingLabels[_rating],
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: ratingColor,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Notes
                TextField(
                  controller: _notesController,
                  maxLines: 4,
                  decoration: InputDecoration(
                    hintText: 'Any notes for the admin? (optional)',
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.all(16),
                  ),
                ),
                const SizedBox(height: 24),

                // Submit
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: _loading ? null : _handleSubmit,
                    icon: _loading
                        ? const SizedBox(
                            height: 20, width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : const Icon(Icons.send),
                    label: const Text('Complete Session', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                    style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
