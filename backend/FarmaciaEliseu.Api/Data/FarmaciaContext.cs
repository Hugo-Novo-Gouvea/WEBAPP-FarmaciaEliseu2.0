using FarmaciaEliseu.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FarmaciaEliseu.Api.Data;

// DbContext somente para as tabelas ja existentes no banco FarmaciaEliseu.
// Nao usa migrations: o schema e mapeado via Fluent API para as tabelas/colunas reais.
public class FarmaciaContext : DbContext
{
    public FarmaciaContext(DbContextOptions<FarmaciaContext> options) : base(options)
    {
    }

    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<Funcionario> Funcionarios => Set<Funcionario>();
    public DbSet<Produto> Produtos => Set<Produto>();
    public DbSet<Movimento> Movimentos => Set<Movimento>();
    public DbSet<ItemPorMovimento> ItensPorMovimento => Set<ItemPorMovimento>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Cliente>(entity =>
        {
            entity.ToTable("clientes");
            entity.HasKey(c => c.ClientesId);
            entity.Property(c => c.ClientesId).HasColumnName("clientes_id").ValueGeneratedOnAdd();
            entity.Property(c => c.Nome).HasColumnName("nome").HasMaxLength(200);
            entity.Property(c => c.Endereco).HasColumnName("endereco").HasMaxLength(200);
            entity.Property(c => c.Rg).HasColumnName("rg").HasMaxLength(30);
            entity.Property(c => c.Cpf).HasColumnName("cpf").HasMaxLength(30);
            entity.Property(c => c.Telefone).HasColumnName("telefone").HasMaxLength(50);
            entity.Property(c => c.Celular).HasColumnName("celular").HasMaxLength(50);
            entity.Property(c => c.DataNascimento).HasColumnName("data_nascimento").HasColumnType("timestamp(0) without time zone");
            entity.Property(c => c.CodigoFichario).HasColumnName("codigo_fichario");
            entity.Property(c => c.DataCadastro).HasColumnName("data_cadastro").HasColumnType("timestamp(0) without time zone");
            entity.Property(c => c.DataUltimoRegistro).HasColumnName("data_ultimo_registro").HasColumnType("timestamp(0) without time zone");
            entity.Property(c => c.Deletado).HasColumnName("deletado");
            entity.HasQueryFilter(c => !c.Deletado);
        });

        modelBuilder.Entity<Funcionario>(entity =>
        {
            entity.ToTable("funcionarios");
            entity.HasKey(f => f.FuncionariosId);
            entity.Property(f => f.FuncionariosId).HasColumnName("funcionarios_id").ValueGeneratedOnAdd();
            entity.Property(f => f.Nome).HasColumnName("nome").HasMaxLength(200);
            entity.Property(f => f.CodigoAntigo).HasColumnName("codigo_antigo").HasMaxLength(10);
            entity.Property(f => f.DataCadastro).HasColumnName("data_cadastro").HasColumnType("timestamp(0) without time zone");
            entity.Property(f => f.DataUltimoRegistro).HasColumnName("data_ultimo_registro").HasColumnType("timestamp(0) without time zone");
            entity.Property(f => f.Deletado).HasColumnName("deletado");
            entity.HasQueryFilter(f => !f.Deletado);
        });

        modelBuilder.Entity<Produto>(entity =>
        {
            entity.ToTable("produtos");
            entity.HasKey(p => p.ProdutosId);
            entity.Property(p => p.ProdutosId).HasColumnName("produtos_id").ValueGeneratedOnAdd();
            entity.Property(p => p.Descricao).HasColumnName("descricao").HasMaxLength(200);
            entity.Property(p => p.UnidadeMedida).HasColumnName("unidade_medida").HasMaxLength(200);
            entity.Property(p => p.PrecoCompra).HasColumnName("preco_compra").HasColumnType("numeric(19,4)");
            entity.Property(p => p.PrecoVenda).HasColumnName("preco_venda").HasColumnType("numeric(19,4)");
            entity.Property(p => p.Localizacao).HasColumnName("localizacao").HasMaxLength(200);
            entity.Property(p => p.Laboratorio).HasColumnName("laboratorio").HasMaxLength(200);
            entity.Property(p => p.Principio).HasColumnName("principio").HasMaxLength(200);
            entity.Property(p => p.Generico).HasColumnName("generico").HasMaxLength(3);
            entity.Property(p => p.CodigoProduto).HasColumnName("codigo_produto").HasMaxLength(20);
            entity.Property(p => p.CodigoBarras).HasColumnName("codigo_barras").HasMaxLength(50);
            entity.Property(p => p.DataCadastro).HasColumnName("data_cadastro").HasColumnType("timestamp(0) without time zone");
            entity.Property(p => p.DataUltimoRegistro).HasColumnName("data_ultimo_registro").HasColumnType("timestamp(0) without time zone");
            entity.Property(p => p.Deletado).HasColumnName("deletado");
            entity.HasQueryFilter(p => !p.Deletado);
        });

        modelBuilder.Entity<Movimento>(entity =>
        {
            entity.ToTable("movimentos");
            entity.HasKey(m => m.MovimentosId);
            entity.Property(m => m.MovimentosId).HasColumnName("movimentos_id").ValueGeneratedOnAdd();
            entity.Property(m => m.CodigoMovimento).HasColumnName("codigo_movimento");
            entity.Property(m => m.ClientesId).HasColumnName("clientes_id");
            entity.Property(m => m.ClientesNome).HasColumnName("clientes_nome").HasMaxLength(200);
            entity.Property(m => m.FuncionariosId).HasColumnName("funcionarios_id");
            entity.Property(m => m.FuncionariosNome).HasColumnName("funcionarios_nome").HasMaxLength(200);
            entity.Property(m => m.ValorTotal).HasColumnName("valor_total").HasColumnType("numeric(19,4)");
            entity.Property(m => m.DescontoTotal).HasColumnName("desconto_total").HasColumnType("numeric(19,4)");
            entity.Property(m => m.ValorPago).HasColumnName("valor_pago").HasColumnType("numeric(19,4)");
            entity.Property(m => m.DataVenda).HasColumnName("data_venda").HasColumnType("timestamp(0) without time zone");
            entity.Property(m => m.DataPagamento).HasColumnName("data_pagamento").HasColumnType("timestamp(0) without time zone");
            entity.Property(m => m.DataCadastro).HasColumnName("data_cadastro").HasColumnType("timestamp(0) without time zone");
            entity.Property(m => m.DataUltimoRegistro).HasColumnName("data_ultimo_registro").HasColumnType("timestamp(0) without time zone");
            entity.Property(m => m.Deletado).HasColumnName("deletado");
            entity.HasQueryFilter(m => !m.Deletado);
        });

        modelBuilder.Entity<ItemPorMovimento>(entity =>
        {
            entity.ToTable("itens_por_movimento");
            entity.HasKey(i => i.IpmId);
            entity.Property(i => i.IpmId).HasColumnName("ipm_id").ValueGeneratedOnAdd();
            entity.Property(i => i.MovimentosId).HasColumnName("movimentos_id");
            entity.Property(i => i.ProdutosId).HasColumnName("produtos_id");
            entity.Property(i => i.ProdutosDescricao).HasColumnName("produtos_descricao").HasMaxLength(200);
            entity.Property(i => i.ProdutosCodigoProduto).HasColumnName("produtos_codigo_produto").HasMaxLength(20);
            entity.Property(i => i.Quantidade).HasColumnName("quantidade");
            entity.Property(i => i.PrecoUnitarioDiaVenda).HasColumnName("preco_unitario_dia_venda").HasColumnType("numeric(19,4)");
            entity.Property(i => i.PrecoTotalDiaVenda).HasColumnName("preco_total_dia_venda").HasColumnType("numeric(19,4)");
            entity.Property(i => i.PrecoUnitarioAtual).HasColumnName("preco_unitario_atual").HasColumnType("numeric(19,4)");
            entity.Property(i => i.PrecoTotalAtual).HasColumnName("preco_total_atual").HasColumnType("numeric(19,4)");
            entity.Property(i => i.DataCadastro).HasColumnName("data_cadastro").HasColumnType("timestamp(0) without time zone");
            entity.Property(i => i.Deletado).HasColumnName("deletado");
            entity.Property(i => i.DataPagamentoItem).HasColumnName("data_pagamento_item").HasColumnType("timestamp(0) without time zone");
            entity.HasQueryFilter(i => !i.Deletado);
        });
    }
}
