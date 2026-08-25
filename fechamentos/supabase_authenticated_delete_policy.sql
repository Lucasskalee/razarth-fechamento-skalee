-- Revisar e executar manualmente no Supabase quando a autorizacao por usuario
-- estiver definida. A Function /api/excluir-nota resolve a exclusao autenticada
-- sem depender desta policy.
--
-- ATENCAO: a policy atual para `anon` permite exclusao publica e deve ser
-- removida em uma revisao de seguranca coordenada com as demais operacoes.

drop policy if exists "authenticated_can_delete_loss_notes" on public.loss_notes;
create policy "authenticated_can_delete_loss_notes"
  on public.loss_notes
  for delete
  to authenticated
  using (true);
